import { getProfile } from "@/lib/storage/profileRepository";
import { ensureMasteryRecordsExist, getRecentWorkouts, getRecentCompletions } from "@/lib/storage/workoutRepository";
import { getRecentReschedules, getRecentReflections } from "@/lib/storage/plannerRepository";
import { getTodayCheckin } from "@/lib/workout/getTodayCheckin";
import { getRecentCheckinHistory } from "./readCheckinHistory";
import { detectAndSuggestPatterns } from "@/lib/planner-algorithm/detectPatterns";
import { listMemoriesForPlanning } from "@/lib/planner-algorithm/coachMemoryStore";
import { manualCalendarProvider } from "@/lib/calendar/manualCalendarProvider";
import { scoreSelfCareWindows } from "@/lib/calendar/selfCareWindowScoring";
import { detectCalendarMode } from "@/lib/calendar/detectMode";
import type { DailyPlan } from "@/types/planner";

export async function requestDailyPlan(): Promise<DailyPlan> {
  const [
    profile,
    masteryRecords,
    recentWorkouts,
    recentCompletions,
    todayCheckin,
    recentCheckins,
    recentReschedules,
    recentReflections,
    memoriesForPlanning,
  ] = await Promise.all([
    getProfile(),
    ensureMasteryRecordsExist(),
    getRecentWorkouts(5),
    getRecentCompletions(10),
    getTodayCheckin(),
    getRecentCheckinHistory(7),
    getRecentReschedules(10),
    getRecentReflections(10),
    listMemoriesForPlanning(),
  ]);

  const recentExerciseIds = recentWorkouts.flatMap((w) => w.main.map((e) => e.exercise_id));

  // Calendar Intelligence (PRD-008) — computed here, client-side, since
  // Manual Mode's blocks live in localStorage. Only Manual Mode is
  // genuinely wired up (see chat); this silently produces an empty
  // window list if no template has ever been saved, which is a safe,
  // backward-compatible no-op for anyone who hasn't visited
  // /calendar-setup yet.
  const today = new Date().toISOString().slice(0, 10);
  const dayOfWeek = new Date().getDay();
  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
  const todaysBlocks = await manualCalendarProvider.getBlocksForDate(today);
  const selfCareWindows = scoreSelfCareWindows(todaysBlocks, dayOfWeek, memoriesForPlanning);
  const calendarMode = detectCalendarMode(todaysBlocks, dayOfWeek, nowMinutes);

  const response = await fetch("/api/planner/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      profile,
      todayCheckin,
      recentCheckins,
      masteryRecords,
      recentExerciseIds,
      recentCompletions,
      recentReschedules,
      recentReflections,
      memoriesForPlanning,
      selfCareWindows,
      calendarMode,
    }),
  });

  if (!response.ok) throw new Error(`Planner request failed: ${response.status}`);
  const plan = (await response.json()) as DailyPlan;

  // Learning Rules (PRD-006/007) — runs client-side, where localStorage
  // (and therefore Coach Memory) actually exists. Never blocks the plan
  // from returning if it fails.
  try {
    await detectAndSuggestPatterns(recentReschedules, recentCheckins, recentCompletions, recentReflections);
  } catch (err) {
    console.error("Pattern detection failed (non-blocking)", err);
  }

  return plan;
}
