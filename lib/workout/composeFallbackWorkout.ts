import type { ScoredCandidate } from "./candidateScoring";
import type { GeneratedWorkout, PrescribedExercise } from "@/types/workout";

// Deterministic safety net — used if the AI call fails outright, or
// returns exercise IDs that don't exist in the candidate pool (validated
// in the API route). Always safe because it only ever draws from the
// already-filtered candidate list, same as the AI path.
export function composeFallbackWorkout(
  candidates: ScoredCandidate[],
  availableMinutes: number
): GeneratedWorkout {
  const toPrescribed = (c: ScoredCandidate): PrescribedExercise => ({
    exercise_id: c.exercise.id,
    name: c.exercise.name,
    category: c.exercise.category,
    prescribed_target: c.mastery?.current_target ?? c.exercise.base_target,
    prescribed_sets: c.exercise.base_sets,
    prescription_type: c.exercise.prescription_type,
    estimated_duration_min: c.exercise.estimated_duration_min,
    safety_instructions: c.exercise.safety_instructions,
    alternative_exercise_id: c.exercise.alternative_exercise_id,
  });

  const byCategory = (cat: string) => candidates.filter((c) => c.exercise.category === cat);

  const warmup = (byCategory("mobility")[0] ? [byCategory("mobility")[0]] : []).map(toPrescribed);
  const cooldown = (byCategory("recovery")[0] ? [byCategory("recovery")[0]] : []).map(toPrescribed);

  const usedIds = new Set([...warmup, ...cooldown].map((e) => e.exercise_id));
  const mainPool = candidates.filter((c) => !usedIds.has(c.exercise.id));
  const budgetMinutes = Math.max(5, availableMinutes - 10);

  const main: PrescribedExercise[] = [];
  let usedMinutes = 0;
  for (const c of mainPool) {
    const cost = c.exercise.estimated_duration_min * c.exercise.base_sets;
    if (usedMinutes + cost > budgetMinutes) continue;
    main.push(toPrescribed(c));
    usedMinutes += cost;
    if (main.length >= 4) break;
  }

  const total = [...warmup, ...main, ...cooldown].reduce(
    (sum, e) => sum + e.estimated_duration_min * e.prescribed_sets,
    0
  );

  return {
    date: new Date().toISOString().slice(0, 10),
    primary_goal: "Improve Recovery",
    warmup,
    main,
    cooldown,
    total_duration_min: total,
    coach_note: "Even iets misgegaan bij het samenstellen — dit is een eenvoudige, veilige basisworkout voor vandaag.",
  };
}
