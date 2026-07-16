import type { CheckinEntry } from "@/types/checkin";
import type { WorkoutCompletionLog } from "@/types/workout";
import { downgradeTier } from "./energyMapping";
import type { IntensityTier } from "@/types/planner";

// Priority 4 — Recovery. Analyses yesterday's workout, sleep, stress and
// soreness. Poor recovery downgrades intensity by one tier — it never
// increases it, and it never blocks the day outright (that's Priority 1's job).
export function needsRecoveryDowngrade(
  todayCheckin: CheckinEntry | null,
  yesterdayCompletion: WorkoutCompletionLog | null
): boolean {
  if (!todayCheckin) return false;
  const poorSleep = (todayCheckin.sleep_score ?? 5) <= 2;
  const highStress = todayCheckin.stress_level >= 8;
  const veryStiff = todayCheckin.body_status === "Erg stijf";
  const hardYesterday = (yesterdayCompletion?.completion_pct ?? 100) < 50;
  return poorSleep || highStress || veryStiff || hardYesterday;
}

export function applyRecoveryAdjustment(
  baseTier: IntensityTier,
  todayCheckin: CheckinEntry | null,
  yesterdayCompletion: WorkoutCompletionLog | null
): IntensityTier {
  return needsRecoveryDowngrade(todayCheckin, yesterdayCompletion) ? downgradeTier(baseTier) : baseTier;
}
