import type { CheckinEntry } from "@/types/checkin";
import type { WorkoutCompletionLog } from "@/types/workout";
import type { DailyReadinessScore, ReadinessCategory, IntensityTier } from "@/types/planner";
import { energyEnumToScale } from "@/lib/planner/energyMapping"; // reused from PRD-004, not duplicated

// Step 4 — Daily Readiness Score. Combines energy, sleep, stress, pain,
// and recent recovery trend into one internal score. Per the PRD: "It
// should not pressure the user" — so this number is never shown in any
// UI, only used internally to pick a category and intensity tier.
// Wearable data would factor in here too (PRD-006 step 1 lists it as a
// source) but no wearable integration exists yet (PRD-002/PRD-005 both
// flagged this as a stub) — the score simply omits that term until then.

const CATEGORY_TO_TIER: Record<ReadinessCategory, IntensityTier> = {
  Excellent: "full",
  Good: "normal",
  Moderate: "moderate",
  Limited: "very_light",
  "Recovery Required": "recovery",
};

export function calculateReadinessScore(
  todayCheckin: CheckinEntry | null,
  recentCompletions: WorkoutCompletionLog[]
): DailyReadinessScore {
  if (!todayCheckin) {
    // No check-in yet today — assume a moderate, not-worst-case day rather
    // than blocking the planner entirely.
    return { category: "Moderate", numeric_score: 50, tier: "moderate" };
  }

  const energyScale = energyEnumToScale(todayCheckin.energy_level); // 1-5
  const sleepScore = todayCheckin.sleep_score ?? 3; // 1-5
  const stressScore = 10 - todayCheckin.stress_level; // invert: low stress = good, 0-10
  const painScore = 10 - todayCheckin.foot_pain; // invert: low pain = good, 0-10

  const recentAvgCompletion =
    recentCompletions.length > 0
      ? recentCompletions.reduce((sum, c) => sum + c.completion_pct, 0) / recentCompletions.length
      : 75; // no history yet — assume reasonable recovery, not zero

  // Weighted blend, normalized to 0-100. Weights are a first-pass judgment
  // call (energy and pain weighted highest since they're the most acute
  // signals) — tunable, see MIGRATION_PLAN-style note in README.
  const normalized =
    (energyScale / 5) * 30 +
    (sleepScore / 5) * 20 +
    (stressScore / 10) * 15 +
    (painScore / 10) * 25 +
    (recentAvgCompletion / 100) * 10;

  const numeric_score = Math.round(normalized);

  let category: ReadinessCategory;
  if (numeric_score >= 85) category = "Excellent";
  else if (numeric_score >= 70) category = "Good";
  else if (numeric_score >= 50) category = "Moderate";
  else if (numeric_score >= 30) category = "Limited";
  else category = "Recovery Required";

  return { category, numeric_score, tier: CATEGORY_TO_TIER[category] };
}
