import { manualCalendarProvider } from "./manualCalendarProvider";
import { scoreSelfCareWindows } from "./selfCareWindowScoring";
import { addAdHocEvent } from "@/lib/storage/calendarRepository";
import type { LocalCoachMemory } from "@/types/planner";
import type { SelfCareWindow } from "@/types/calendar";

export interface RescheduleOutcome {
  newWindow: SelfCareWindow | null;
  explanation: string;
}

// "If a new meeting appears, the planner automatically recalculates...
// always explain the change." Real recalculation against the day's
// actual remaining free blocks, not a canned heuristic sentence — this
// is what upgrades the existing RescheduleFlow (PRD-004/006) from a
// static suggestion to genuine replanning, once calendar data exists.
export async function recalculateAfterChange(
  date: string,
  conflictStart: string,
  conflictEnd: string,
  conflictLabel: string,
  confirmedMemories: LocalCoachMemory[]
): Promise<RescheduleOutcome> {
  await addAdHocEvent({ date, start_time: conflictStart, end_time: conflictEnd, label: conflictLabel });

  const dayOfWeek = new Date(date + "T12:00:00").getDay();
  const blocks = await manualCalendarProvider.getBlocksForDate(date);
  const windows = scoreSelfCareWindows(blocks, dayOfWeek, confirmedMemories);

  const best = windows.find((w) => w.duration_minutes >= 15) ?? null;

  if (!best) {
    return {
      newWindow: null,
      explanation: "Er is vandaag geen ruimte meer over. Morgenochtend is de eerstvolgende goede kans.",
    };
  }

  const isToday = true; // this function only searches today's remaining blocks
  const explanation = isToday
    ? `Verplaatst naar ${best.start_time}–${best.end_time}, omdat ${best.reasons[0]?.toLowerCase() ?? "dit het beste overgebleven moment is"}.`
    : "Verplaatst naar morgenochtend.";

  return { newWindow: best, explanation };
}
