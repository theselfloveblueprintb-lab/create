import type { WorkoutCompletionLog } from "@/types/workout";

// Priority 6 — Consistency. If nothing's been completed in the last 3+
// days, this is a restart, not a lapse to address with more intensity.
// Restart never increases intensity — it can only cap it lower, and it
// changes the coaching frame (handled in the AI prompt), never the tone
// of blame.
const RESTART_THRESHOLD_DAYS = 3;

export function isRestartNeeded(recentCompletions: WorkoutCompletionLog[]): boolean {
  if (recentCompletions.length === 0) return false; // brand new user, not a "restart"
  const mostRecent = recentCompletions[recentCompletions.length - 1];
  const daysSince = Math.floor(
    (Date.now() - new Date(mostRecent.date).getTime()) / (1000 * 60 * 60 * 24)
  );
  return daysSince >= RESTART_THRESHOLD_DAYS;
}
