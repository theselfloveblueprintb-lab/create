import { localStorageAdapter } from "./localStorageAdapter";
import type { ExerciseMasteryRecord, WorkoutCompletionLog, GeneratedWorkout } from "@/types/workout";
import { createInitialMasteryRecord } from "@/lib/workout/masteryEngine";
import { EXERCISE_LIBRARY, getExerciseById } from "@/lib/workout/exerciseLibrary";

// Same pattern as checkinRepository/profileRepository: one module owns
// the storage keys. Same localStorage caveat applies (see chat, PRD-002).

const MASTERY_KEY = "crea:mastery";
const COMPLETIONS_KEY = "crea:workout-completions";
const RECENT_WORKOUTS_KEY = "crea:recent-workouts"; // used for variety scoring

export async function getAllMasteryRecords(): Promise<Record<string, ExerciseMasteryRecord>> {
  const stored = await localStorageAdapter.get<Record<string, ExerciseMasteryRecord>>(MASTERY_KEY);
  return stored ?? {};
}

export async function getMasteryRecord(exerciseId: string): Promise<ExerciseMasteryRecord> {
  const all = await getAllMasteryRecords();
  if (all[exerciseId]) return all[exerciseId];
  const exercise = getExerciseById(exerciseId);
  return exercise ? createInitialMasteryRecord(exercise) : ({} as ExerciseMasteryRecord);
}

export async function saveMasteryRecord(record: ExerciseMasteryRecord): Promise<void> {
  const all = await getAllMasteryRecords();
  all[record.exercise_id] = record;
  await localStorageAdapter.set(MASTERY_KEY, all);
}

export async function getRecentCompletions(limit = 10): Promise<WorkoutCompletionLog[]> {
  const list = (await localStorageAdapter.get<WorkoutCompletionLog[]>(COMPLETIONS_KEY)) ?? [];
  return list.slice(-limit);
}

export async function saveCompletion(log: WorkoutCompletionLog): Promise<void> {
  const list = (await localStorageAdapter.get<WorkoutCompletionLog[]>(COMPLETIONS_KEY)) ?? [];
  list.push(log);
  await localStorageAdapter.set(COMPLETIONS_KEY, list);
}

export async function getRecentWorkouts(limit = 5): Promise<GeneratedWorkout[]> {
  const list = (await localStorageAdapter.get<GeneratedWorkout[]>(RECENT_WORKOUTS_KEY)) ?? [];
  return list.slice(-limit);
}

export async function saveGeneratedWorkout(workout: GeneratedWorkout): Promise<void> {
  const list = (await localStorageAdapter.get<GeneratedWorkout[]>(RECENT_WORKOUTS_KEY)) ?? [];
  list.push(workout);
  await localStorageAdapter.set(RECENT_WORKOUTS_KEY, list.slice(-20));
}

// Ensures every library exercise has a mastery record before generation —
// new exercises default to their base_target with zero history.
export async function ensureMasteryRecordsExist(): Promise<Record<string, ExerciseMasteryRecord>> {
  const all = await getAllMasteryRecords();
  let changed = false;
  for (const exercise of EXERCISE_LIBRARY) {
    if (!all[exercise.id]) {
      all[exercise.id] = createInitialMasteryRecord(exercise);
      changed = true;
    }
  }
  if (changed) await localStorageAdapter.set(MASTERY_KEY, all);
  return all;
}
