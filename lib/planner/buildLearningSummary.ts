import type { CheckinEntry } from "@/types/checkin";
import type { WorkoutCompletionLog } from "@/types/workout";
import type { RescheduleEvent, DailyReflection } from "@/types/planner";

// "Learning behaviour" (PRD-004) implemented honestly: this is aggregated
// history fed back into the next prompt, not a trained model. Anthropic's
// weights don't update — Crea "learns" by re-reading a growing summary of
// what actually happened, every time it plans. Worth being explicit about
// this distinction rather than letting "the AI learns" imply more than it is.
export function buildLearningSummary(
  recentCheckins: CheckinEntry[],
  recentCompletions: WorkoutCompletionLog[],
  recentReschedules: RescheduleEvent[],
  recentReflections: DailyReflection[]
): string {
  const parts: string[] = [];

  if (recentCompletions.length > 0) {
    const avgCompletion =
      recentCompletions.reduce((sum, c) => sum + c.completion_pct, 0) / recentCompletions.length;
    parts.push(`Gemiddelde afronding recente workouts: ${Math.round(avgCompletion)}%.`);
  }

  if (recentCheckins.length > 0) {
    const avgSleep =
      recentCheckins.reduce((sum, c) => sum + (c.sleep_score ?? 3), 0) / recentCheckins.length;
    const avgStress =
      recentCheckins.reduce((sum, c) => sum + c.stress_level, 0) / recentCheckins.length;
    parts.push(`Gemiddelde slaap: ${avgSleep.toFixed(1)}/5. Gemiddelde stress: ${avgStress.toFixed(1)}/10.`);
  }

  if (recentReschedules.length > 0) {
    const reasonCounts = new Map<string, number>();
    recentReschedules.forEach((r) => reasonCounts.set(r.reason, (reasonCounts.get(r.reason) ?? 0) + 1));
    const topReason = [...reasonCounts.entries()].sort((a, b) => b[1] - a[1])[0];
    parts.push(`Meest voorkomende reden voor verzetten: "${topReason[0]}" (${topReason[1]}x).`);
  }

  const lastReflection = recentReflections[recentReflections.length - 1];
  if (lastReflection?.note_for_tomorrow) {
    parts.push(`Notitie van gisteren voor vandaag: "${lastReflection.note_for_tomorrow}"`);
  }

  return parts.length > 0 ? parts.join(" ") : "Nog onvoldoende geschiedenis voor patronen.";
}
