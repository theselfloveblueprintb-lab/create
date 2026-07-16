import Anthropic from "@anthropic-ai/sdk";
import { withTimeout } from "@/lib/api/withTimeout";
import { EXERCISE_LIBRARY, getExerciseById } from "./exerciseLibrary";
import { getSafeCandidates } from "./safetyFilter";
import { scoreCandidates, type ScoredCandidate } from "./candidateScoring";
import { buildWorkoutSystemPrompt } from "@/lib/ai/workoutSystemPrompt";
import { goalToSkillTags, parseAvailableMinutes } from "./goalMapping";
import { composeFallbackWorkout } from "./composeFallbackWorkout";
import type { UserProfile } from "@/types/profile";
import type { CheckinEntry } from "@/types/checkin";
import type {
  ExerciseMasteryRecord,
  GeneratedWorkout,
  PrescribedExercise,
  WorkoutGoal,
  WorkoutCategory,
} from "@/types/workout";

// Extracted from app/api/workout/generate/route.ts (PRD-003) so the
// Planner (PRD-004) can call the exact same generation pipeline the
// standalone route uses — no duplicated logic, no behavior drift.
// The route itself now just calls this with no overrides.

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface WorkoutOverrides {
  minutesOverride?: number; // Planner-adjusted time budget (e.g. reduced for a low-intensity day)
  forcedCategory?: WorkoutCategory; // e.g. "recovery" when Priority 1 safety stops normal training
  goalOverride?: WorkoutGoal; // Planner already decided the single goal for today
}

export interface WorkoutCoreInput {
  profile: UserProfile;
  todayCheckin: CheckinEntry | null;
  masteryRecords: Record<string, ExerciseMasteryRecord>;
  recentExerciseIds: string[];
  overrides?: WorkoutOverrides;
}

const VALID_GOALS: WorkoutGoal[] = [
  "Improve Cardio",
  "Increase Strength",
  "Improve Recovery",
  "Build Mobility",
  "Increase Harbor Run Readiness",
];

interface AiPrescribedRef {
  exercise_id: string;
  prescribed_target: number;
  prescribed_sets: number;
}
interface AiResponseShape {
  primary_goal: string;
  warmup: AiPrescribedRef[];
  main: AiPrescribedRef[];
  cooldown: AiPrescribedRef[];
  coach_note: string;
}

export async function generateWorkoutCore(input: WorkoutCoreInput): Promise<GeneratedWorkout> {
  const { profile, todayCheckin, masteryRecords, recentExerciseIds, overrides } = input;

  const ownedEquipment = profile.equipment ?? [];
  const footPainToday = todayCheckin?.foot_pain ?? 0;
  const availableMinutes = overrides?.minutesOverride ?? parseAvailableMinutes(profile.available_time);

  let safeExercises = getSafeCandidates(EXERCISE_LIBRARY, ownedEquipment, footPainToday);
  if (overrides?.forcedCategory) {
    // When the Planner has already decided today is a recovery/mobility day,
    // narrow the pool up front rather than hoping the AI picks accordingly.
    const forced = safeExercises.filter((e) => e.category === overrides.forcedCategory);
    // Keep a few general recovery-safe exercises as fallback material even
    // if the forced category alone can't fill the session.
    const recoveryPad = safeExercises.filter((e) => e.category === "recovery" || e.category === "mobility");
    safeExercises = Array.from(new Set([...forced, ...recoveryPad]));
  }

  const skillTags = overrides?.goalOverride
    ? goalToSkillTags(profile.primary_goal) // goal override affects prompt framing, not the tag filter itself
    : goalToSkillTags(profile.primary_goal);

  const scored = scoreCandidates(safeExercises, masteryRecords ?? {}, recentExerciseIds ?? [], skillTags);

  if (scored.length === 0) {
    return composeFallbackWorkout([], availableMinutes);
  }

  const candidateIds = new Set(scored.map((c) => c.exercise.id));

  try {
    const systemPrompt = buildWorkoutSystemPrompt(profile, todayCheckin, availableMinutes, scored);
    const message = await withTimeout(
      anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 1200,
        system: systemPrompt,
        messages: [{ role: "user", content: "Genereer de workout voor vandaag." }],
      }),
      15000,
      "generateWorkoutCore"
    );

    const textBlock = message.content.find((b) => b.type === "text");
    const raw = textBlock && "text" in textBlock ? textBlock.text : "";
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const ai = JSON.parse(cleaned) as AiResponseShape;

    const allRefs = [...ai.warmup, ...ai.main, ...ai.cooldown];
    const allValid = allRefs.every((r) => candidateIds.has(r.exercise_id));
    const goalValid = VALID_GOALS.includes(ai.primary_goal as WorkoutGoal);

    if (!allValid || allRefs.length === 0 || !goalValid) {
      console.warn("Workout Engine: AI response failed validation, using fallback");
      return composeFallbackWorkout(scored, availableMinutes);
    }

    const scoredById = new Map<string, ScoredCandidate>(scored.map((c) => [c.exercise.id, c]));

    const toPrescribed = (ref: AiPrescribedRef): PrescribedExercise | null => {
      const candidate = scoredById.get(ref.exercise_id);
      const exercise = getExerciseById(ref.exercise_id);
      if (!candidate || !exercise) return null;

      const ceiling = candidate.mastery?.mastered
        ? candidate.mastery.next_target ?? exercise.base_target
        : candidate.mastery?.current_target ?? exercise.base_target;
      const safeTarget = Math.min(ref.prescribed_target || ceiling, ceiling);

      return {
        exercise_id: exercise.id,
        name: exercise.name,
        category: exercise.category,
        prescribed_target: safeTarget,
        prescribed_sets: Math.max(1, ref.prescribed_sets || exercise.base_sets),
        prescription_type: exercise.prescription_type,
        estimated_duration_min: exercise.estimated_duration_min,
        safety_instructions: exercise.safety_instructions,
        alternative_exercise_id: exercise.alternative_exercise_id,
      };
    };

    const warmup = ai.warmup.map(toPrescribed).filter((e): e is PrescribedExercise => e !== null);
    const main = ai.main.map(toPrescribed).filter((e): e is PrescribedExercise => e !== null);
    const cooldown = ai.cooldown.map(toPrescribed).filter((e): e is PrescribedExercise => e !== null);

    const total_duration_min = [...warmup, ...main, ...cooldown].reduce(
      (sum, e) => sum + e.estimated_duration_min * e.prescribed_sets,
      0
    );

    return {
      date: new Date().toISOString().slice(0, 10),
      primary_goal: (overrides?.goalOverride ?? ai.primary_goal) as WorkoutGoal,
      warmup,
      main,
      cooldown,
      total_duration_min,
      coach_note: ai.coach_note || "",
    };
  } catch (err) {
    console.error("Workout Engine generation failed", err);
    return composeFallbackWorkout(scored, availableMinutes);
  }
}
