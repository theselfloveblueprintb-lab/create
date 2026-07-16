import { getProfile } from "@/lib/storage/profileRepository";
import { ensureMasteryRecordsExist, getRecentWorkouts } from "@/lib/storage/workoutRepository";
import { getTodayCheckin } from "./getTodayCheckin";
import type { GeneratedWorkout } from "@/types/workout";

// Client-side orchestration: gather everything the API route needs from
// local storage, then hit our own server route (never Anthropic directly —
// same key-safety pattern as Module 1).
export async function requestTodaysWorkout(): Promise<GeneratedWorkout> {
  const [profile, masteryRecords, recentWorkouts, todayCheckin] = await Promise.all([
    getProfile(),
    ensureMasteryRecordsExist(),
    getRecentWorkouts(5),
    getTodayCheckin(),
  ]);

  const recentExerciseIds = recentWorkouts.flatMap((w) => w.main.map((e) => e.exercise_id));

  const response = await fetch("/api/workout/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ profile, todayCheckin, masteryRecords, recentExerciseIds }),
  });

  if (!response.ok) throw new Error(`Workout generation failed: ${response.status}`);
  return (await response.json()) as GeneratedWorkout;
}
