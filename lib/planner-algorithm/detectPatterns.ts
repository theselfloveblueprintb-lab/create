import type { RescheduleEvent } from "@/types/planner";
import type { CheckinEntry } from "@/types/checkin";
import type { WorkoutCompletionLog } from "@/types/workout";
import type { DailyReflection } from "@/types/planner";
import { getExerciseById } from "@/lib/workout/exerciseLibrary";
import { suggestMemory } from "./coachMemoryStore";

// "Learning Rules" (PRD-006/007) — honest pattern-detection over real
// history, never a trained model. Runs client-side after each planning
// cycle. Only ever SUGGESTS — never auto-confirms — per PRD-005/007's
// rule that guesses must not be silently treated as fact.
//
// Coverage against PRD-007's 6 memory types:
//   schedule_pattern     — reschedule reason frequency (built)
//   energy_pattern       — low-energy weekday clustering (built)
//   exercise_preference  — frequently skipped exercises (built)
//   recovery_pattern     — heavy day -> weak next day (built)
//   lifestyle_pattern     — reflection habit only (built; water/breakfast
//                          have no data source anywhere in Crea — not faked)
//   motivation_pattern    — NOT auto-detected. "Responds better to
//                          encouragement" from behavioral data alone is
//                          an emotional inference, which PRD-007 itself
//                          forbids ("never guesses emotions"). This type
//                          can only be created from an explicit signal
//                          that doesn't exist yet (e.g. a direct question),
//                          not inferred from workout completion patterns.

export async function detectAndSuggestPatterns(
  recentReschedules: RescheduleEvent[],
  recentCheckins: CheckinEntry[],
  recentCompletions: WorkoutCompletionLog[] = [],
  recentReflections: DailyReflection[] = []
): Promise<void> {
  await detectSchedulePattern(recentReschedules);
  await detectEnergyPattern(recentCheckins);
  await detectExercisePreference(recentCompletions);
  await detectRecoveryPattern(recentCompletions);
  await detectLifestylePattern(recentCompletions, recentReflections);
}

async function detectSchedulePattern(recentReschedules: RescheduleEvent[]): Promise<void> {
  if (recentReschedules.length < 3) return;
  const counts = new Map<string, number>();
  recentReschedules.forEach((r) => counts.set(r.reason, (counts.get(r.reason) ?? 0) + 1));
  const [topReason, count] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  if (count < 3) return;
  await suggestMemory(
    "schedule_pattern",
    `"${topReason}" is regelmatig de reden om te verzetten.`,
    `${count}x in de laatste ${recentReschedules.length} keer verzet.`
  );
}

async function detectEnergyPattern(recentCheckins: CheckinEntry[]): Promise<void> {
  if (recentCheckins.length < 5) return;
  const lowEnergyDays = recentCheckins
    .filter((c) => c.energy_level === "moe" || c.energy_level === "uitgeput")
    .map((c) => new Date(c.date).getDay());
  if (lowEnergyDays.length < 3) return;
  const dayCounts = new Map<number, number>();
  lowEnergyDays.forEach((d) => dayCounts.set(d, (dayCounts.get(d) ?? 0) + 1));
  const [topDay, dayCount] = [...dayCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  if (dayCount < 2) return;
  const dayNames = ["zondag", "maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag"];
  await suggestMemory(
    "energy_pattern",
    `Energie is vaker laag op ${dayNames[topDay]}.`,
    `${dayCount}x lage energie geregistreerd op deze dag.`
  );
}

async function detectExercisePreference(recentCompletions: WorkoutCompletionLog[]): Promise<void> {
  if (recentCompletions.length < 3) return;
  const skipCounts = new Map<string, number>();
  recentCompletions.forEach((c) => c.exercises_skipped.forEach((id) => skipCounts.set(id, (skipCounts.get(id) ?? 0) + 1)));
  for (const [exerciseId, count] of skipCounts.entries()) {
    if (count < 3) continue;
    const exercise = getExerciseById(exerciseId);
    if (!exercise) continue;
    await suggestMemory(
      "exercise_preference",
      `Vermijdt vaak: ${exercise.name}.`,
      `${count}x overgeslagen in recente workouts.`
    );
  }
}

async function detectRecoveryPattern(recentCompletions: WorkoutCompletionLog[]): Promise<void> {
  if (recentCompletions.length < 4) return;
  let heavyThenWeakCount = 0;
  for (let i = 0; i < recentCompletions.length - 1; i++) {
    const today = recentCompletions[i];
    const next = recentCompletions[i + 1];
    const heavyDay = today.duration_min >= 45;
    const weakNextDay = next.completion_pct < 60;
    if (heavyDay && weakNextDay) heavyThenWeakCount++;
  }
  if (heavyThenWeakCount < 2) return;
  await suggestMemory(
    "recovery_pattern",
    "Na een langere trainingsdag is de afronding de dag erna vaak lager.",
    `${heavyThenWeakCount}x gezien in recente workoutgeschiedenis.`
  );
}

async function detectLifestylePattern(
  recentCompletions: WorkoutCompletionLog[],
  recentReflections: DailyReflection[]
): Promise<void> {
  // Only "forgets evening reflection" is grounded in real data. Water
  // intake and skipping breakfast (PRD-007's other lifestyle examples)
  // have no corresponding data source anywhere in Crea — not detected,
  // not faked.
  if (recentCompletions.length < 5) return;
  const activeDays = recentCompletions.length;
  const reflectionRate = recentReflections.length / activeDays;
  if (reflectionRate < 0.3) {
    await suggestMemory(
      "lifestyle_pattern",
      "Vult de avondreflectie meestal niet in.",
      `Slechts ${recentReflections.length} van de ${activeDays} recente dagen heeft een reflectie.`
    );
  }
}
