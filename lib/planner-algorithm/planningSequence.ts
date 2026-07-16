import Anthropic from "@anthropic-ai/sdk";
import { withTimeout } from "@/lib/api/withTimeout";
import { generateWorkoutCore } from "@/lib/workout/generateWorkoutCore";
import { evaluateSafetyAndHealth } from "./safetyAndHealthCheck";
import { calculateReadinessScore } from "./readinessScore";
import { getMissionForGoal } from "./missions";
import { validateWorkout } from "./validateWorkout";
import { parseAvailableMinutes } from "@/lib/workout/goalMapping";
import { TIER_MINUTE_CAP } from "@/types/planner";
import { getModeSuggestions } from "@/lib/calendar/modeSuggestions";
import type { UserProfile } from "@/types/profile";
import type { CheckinEntry } from "@/types/checkin";
import type { ExerciseMasteryRecord, WorkoutCompletionLog, WorkoutGoal, GeneratedWorkout } from "@/types/workout";
import type { DailyPlan, IntensityTier, LocalCoachMemory } from "@/types/planner";
import type { CalendarMode, SelfCareWindow } from "@/types/calendar";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const VALID_GOALS: WorkoutGoal[] = [
  "Improve Cardio",
  "Increase Strength",
  "Improve Recovery",
  "Build Mobility",
  "Increase Harbor Run Readiness",
];

interface PlanningSequenceInput {
  profile: UserProfile;
  todayCheckin: CheckinEntry | null;
  masteryRecords: Record<string, ExerciseMasteryRecord>;
  recentExerciseIds: string[];
  recentCompletions: WorkoutCompletionLog[];
  // Coach Memory lives in localStorage, which doesn't exist in this
  // server-side module — the caller (requestDailyPlan.ts, client-side)
  // reads it and passes it in. This module never touches storage directly.
  memoriesForPlanning: LocalCoachMemory[];
  // Calendar Intelligence (PRD-008) — same constraint, same pattern.
  // Manual Mode's blocks live in localStorage, so window scoring and mode
  // detection already happened client-side; this module receives the
  // result, never the raw calendar data.
  selfCareWindows: SelfCareWindow[];
  calendarMode: CalendarMode | null;
}

interface AiGoalDecision {
  primary_goal: string;
  secondary_activity: string | null;
  coach_note: string;
}

// The full PRD-006 Planning Sequence, steps 1-9. Step numbers are
// commented inline. This function IS "the Planner Algorithm" — a
// deliberately self-contained module: its only external dependency
// beyond profile/checkin/mastery data is generateWorkoutCore's public
// function (Workout Engine), never its internals, and it defines zero
// exercises itself.
export async function runPlanningSequence(input: PlanningSequenceInput): Promise<DailyPlan> {
  const { profile, todayCheckin, masteryRecords, recentExerciseIds, recentCompletions, memoriesForPlanning, selfCareWindows, calendarMode } = input;

  // ---- Step 1: Load User Data — done by the caller, passed in here.
  // (Coach Memory is loaded below; Calendar/Wearable remain stubs — flagged.)

  // ---- Step 2: Safety Check (Priority 1) + Health (Priority 2) ----
  const { safetyCompromised, healthConstrained, reasons: safetyHealthReasons } = evaluateSafetyAndHealth(
    profile,
    todayCheckin
  );

  // ---- Step 3: Time Analysis ----
  // Calendar Availability is still a stub (PRD-002/005) — falls back to
  // the user's stated default available time, same limitation as PRD-004.
  const rawAvailableMinutes = parseAvailableMinutes(profile.available_time);

  // If Manual Mode calendar data produced a scored window, its duration
  // further constrains the time budget — never exceed what's actually free.
  const bestWindow = selfCareWindows.length > 0 ? selfCareWindows[0] : null;
  const calendarConstrainedMinutes = bestWindow
    ? Math.min(rawAvailableMinutes, bestWindow.duration_minutes)
    : rawAvailableMinutes;

  // ---- Step 4: Daily Readiness Score ----
  const readiness = calculateReadinessScore(todayCheckin, recentCompletions);
  let tier: IntensityTier = readiness.tier;

  // ---- Step 6: Recovery Analysis (7-day trend) ----
  // Folded into calculateReadinessScore's recentAvgCompletion term rather
  // than a separate pass — same signal PRD-006 asks for (yesterday +
  // last-7-days workload trend), computed once.

  // Safety (Priority 1) always wins regardless of readiness.
  const isRecoveryPlan = safetyCompromised;
  if (isRecoveryPlan) tier = "recovery";

  // ---- Priority Rules: Consistency (restart detection) ----
  const isRestart =
    recentCompletions.length > 0 &&
    Math.floor((Date.now() - new Date(recentCompletions[recentCompletions.length - 1].date).getTime()) / 86400000) >= 3;
  if (isRestart && tier !== "recovery") tier = "very_light";

  const availableMinutes = Math.min(calendarConstrainedMinutes, TIER_MINUTE_CAP[tier]);

  // Travel mode: hard rule, code-enforced, not left to the AI — never
  // recommend physical exercise while driving. The workout still gets
  // generated (forced to "recovery" category as the safest possible
  // content) but mode_suggestions becomes the actual displayed
  // recommendation; the UI is expected to lead with those, not the workout.
  const isTravelMode = calendarMode === "travel";
  const modeSuggestions = calendarMode ? getModeSuggestions(calendarMode) : [];

  // ---- Step 5: Goal Prioritisation (mission-aware) ----
  const mission = getMissionForGoal(profile.primary_goal);
  const memoryContext =
    memoriesForPlanning
      .map((m) =>
        m.status === "confirmed"
          ? `- ${m.statement}`
          : `- ${m.statement} (nog niet bevestigd door gebruiker — behandel als voorlopig, niet als vaststaand)`
      )
      .join("\n") || "Nog geen bevestigde patronen.";

  const decisionPrompt = buildGoalDecisionPrompt({
    profile,
    mission,
    tier,
    availableMinutes,
    isRecoveryPlan,
    isRestart,
    healthConstrained,
    safetyHealthReasons,
    memoryContext,
  });

  let decision: AiGoalDecision;
  try {
    const message = await withTimeout(
      anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 500,
        system: decisionPrompt,
        messages: [{ role: "user", content: "Bepaal het hoofddoel en eventueel secundaire activiteit voor vandaag." }],
      }),
      15000,
      "planningSequence"
    );
    const textBlock = message.content.find((b) => b.type === "text");
    const raw = textBlock && "text" in textBlock ? textBlock.text : "";
    const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim()) as AiGoalDecision;
    decision = VALID_GOALS.includes(parsed.primary_goal as WorkoutGoal)
      ? parsed
      : { primary_goal: isRecoveryPlan ? "Improve Recovery" : "Build Mobility", secondary_activity: null, coach_note: "Rustig aan vandaag." };
  } catch (err) {
    console.error("Planner Algorithm: goal decision failed, using safe default", err);
    decision = {
      primary_goal: isRecoveryPlan ? "Improve Recovery" : "Build Mobility",
      secondary_activity: null,
      coach_note: "Wat je vandaag ook doet, het telt.",
    };
  }

  // ---- Step 7 + Step 8: Request Workout, Validate, Retry ----
  const workout = await requestAndValidateWorkout({
    profile,
    todayCheckin,
    masteryRecords,
    recentExerciseIds,
    availableMinutes,
    isRecoveryPlan: isRecoveryPlan || isTravelMode, // travel forces the same safe, non-strenuous content pool
    goal: decision.primary_goal as WorkoutGoal,
  });

  // ---- Step 9: Create Daily Plan, with explicit reasoning bullets ----
  const reasoning_bullets = buildReasoningBullets({
    todayCheckin,
    readiness,
    availableMinutes,
    mission,
    isRecoveryPlan,
    isRestart,
    safetyHealthReasons,
  });
  if (bestWindow) {
    reasoning_bullets.push(...bestWindow.reasons);
  }
  if (isTravelMode) {
    reasoning_bullets.push("Je bent onderweg — geen fysieke training, wel deze veilige opties.");
  }

  return {
    date: new Date().toISOString().slice(0, 10),
    is_recovery_plan: isRecoveryPlan,
    is_restart: isRestart,
    intensity_tier: tier,
    available_minutes: availableMinutes,
    primary_goal: decision.primary_goal as WorkoutGoal,
    reasoning: decision.coach_note,
    reasoning_bullets,
    primary_workout: workout,
    secondary_activity: decision.secondary_activity,
    coach_note: decision.coach_note,
    calendar_mode: calendarMode,
    mode_suggestions: modeSuggestions,
    recommended_window: bestWindow,
  };
}

function buildGoalDecisionPrompt(args: {
  profile: UserProfile;
  mission: ReturnType<typeof getMissionForGoal>;
  tier: IntensityTier;
  availableMinutes: number;
  isRecoveryPlan: boolean;
  isRestart: boolean;
  healthConstrained: boolean;
  safetyHealthReasons: string[];
  memoryContext: string;
}): string {
  const { profile, mission, tier, availableMinutes, isRecoveryPlan, isRestart, healthConstrained, safetyHealthReasons, memoryContext } = args;
  return `Je bent de Crea Planner Algorithm. Kernvraag: niet "wat is de perfecte workout" maar "wat is het beste plan voor vandaag". Voelt als coach, nooit als taakbeheerder. Falen bestaat niet.

Missie: ${mission.name} — ${mission.description}${mission.target_date ? ` (streefdatum: ${mission.target_date})` : ""}
Coachstijl: ${profile.coach_style}
Intensiteit (vastgesteld, niet aanpasbaar): ${tier}
Beschikbare tijd: ${availableMinutes} minuten
Recovery-dag: ${isRecoveryPlan ? "ja" : "nee"}
Herstart na pauze: ${isRestart ? "ja" : "nee"}
Gezondheidscontext: ${healthConstrained ? safetyHealthReasons.join(" ") : "geen bijzonderheden"}
Bevestigde patronen over deze gebruiker:
${memoryContext}

Kies exact ÉÉN hoofddoel uit: "Improve Cardio", "Increase Strength", "Improve Recovery", "Build Mobility", "Increase Harbor Run Readiness".
Bepaal of een secundaire activiteit (max 1) vandaag waarde toevoegt.
Schrijf een coach_note in de toon van "${profile.coach_style}".

Antwoord ALLEEN met geldige JSON: {"primary_goal": "...", "secondary_activity": "... of null", "coach_note": "..."}`;
}

async function requestAndValidateWorkout(args: {
  profile: UserProfile;
  todayCheckin: CheckinEntry | null;
  masteryRecords: Record<string, ExerciseMasteryRecord>;
  recentExerciseIds: string[];
  availableMinutes: number;
  isRecoveryPlan: boolean;
  goal: WorkoutGoal;
}): Promise<GeneratedWorkout> {
  const { profile, todayCheckin, masteryRecords, recentExerciseIds, isRecoveryPlan, goal } = args;
  let minutesBudget = args.availableMinutes;
  const MAX_ATTEMPTS = 3;

  let lastWorkout: GeneratedWorkout | null = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const workout = await generateWorkoutCore({
      profile,
      todayCheckin,
      masteryRecords,
      recentExerciseIds,
      overrides: {
        minutesOverride: minutesBudget,
        forcedCategory: isRecoveryPlan ? "recovery" : undefined,
        goalOverride: goal,
      },
    });
    lastWorkout = workout;

    const result = validateWorkout(workout, {
      availableMinutes: args.availableMinutes,
      maxIntensityAllowed: isRecoveryPlan ? "recovery" : "challenging",
    });

    if (result.valid) return workout;

    console.warn(`Planner Algorithm: workout request attempt ${attempt} failed validation — ${result.reason}`);
    // Tighten the budget and retry rather than repeating the identical request.
    minutesBudget = Math.max(10, Math.round(minutesBudget * 0.7));
  }

  // All attempts failed validation — return the last (safe, since
  // generateWorkoutCore always falls back internally) result rather than
  // erroring the whole day out.
  return lastWorkout as GeneratedWorkout;
}

function buildReasoningBullets(args: {
  todayCheckin: CheckinEntry | null;
  readiness: ReturnType<typeof calculateReadinessScore>;
  availableMinutes: number;
  mission: ReturnType<typeof getMissionForGoal>;
  isRecoveryPlan: boolean;
  isRestart: boolean;
  safetyHealthReasons: string[];
}): string[] {
  const { todayCheckin, availableMinutes, mission, isRecoveryPlan, isRestart, safetyHealthReasons } = args;
  const bullets: string[] = [];

  if (isRecoveryPlan) {
    bullets.push(...safetyHealthReasons);
    bullets.push("Vandaag is daarom een herstelplan.");
    return bullets;
  }

  if (todayCheckin) {
    if (todayCheckin.sleep_score && todayCheckin.sleep_score >= 4) bullets.push("Je hebt goed geslapen.");
    if (todayCheckin.foot_pain <= 2) bullets.push("Je voetpijn is laag vandaag.");
    if (todayCheckin.stress_level <= 3) bullets.push("Je stressniveau is laag.");
  }
  bullets.push(`Je hebt een vrij blok van ongeveer ${availableMinutes} minuten.`);
  if (mission.name !== "Algemeen") bullets.push(`${mission.name} is je huidige prioriteit.`);
  if (isRestart) bullets.push("Je pakt de draad weer op — we bouwen rustig terug op.");

  return bullets.length > 0 ? bullets : ["Dit is een evenwichtig plan gebaseerd op je huidige situatie."];
}
