import type { Exercise, ExerciseMasteryRecord } from "@/types/workout";

// Mastery rule (see chat): the last 3 attempts must all meet or exceed the
// current target. This matches the PRD-003 example exactly — 6, 8, 10, 10,
// 10 masters a target of 10. Targets never increase from time passing,
// only from mastery. A missed rep never lowers the target or gets flagged
// as failure — it's just data.
const CONSISTENCY_WINDOW = 3;
const PROGRESSION_MULTIPLIER = 1.2;

export function createInitialMasteryRecord(exercise: Exercise): ExerciseMasteryRecord {
  return {
    exercise_id: exercise.id,
    current_target: exercise.base_target,
    attempts: [],
    current_best: 0,
    consistency_score: 0,
    mastered: false,
    next_target: null,
  };
}

export function recordAttempt(
  record: ExerciseMasteryRecord,
  completed: number
): ExerciseMasteryRecord {
  const attempts = [...record.attempts, completed];
  const recent = attempts.slice(-CONSISTENCY_WINDOW);
  const metTarget = recent.filter((a) => a >= record.current_target).length;
  const consistency_score = recent.length > 0 ? metTarget / recent.length : 0;
  const current_best = Math.max(record.current_best, completed);

  const mastered =
    recent.length >= CONSISTENCY_WINDOW && recent.every((a) => a >= record.current_target);

  if (mastered && !record.mastered) {
    const nextTarget = Math.ceil(record.current_target * PROGRESSION_MULTIPLIER);
    return {
      ...record,
      attempts,
      current_best,
      consistency_score,
      mastered: true,
      next_target: nextTarget,
    };
  }

  return { ...record, attempts, current_best, consistency_score, mastered: record.mastered, next_target: record.next_target };
}

// Called when the user's next workout includes a mastered exercise —
// advances current_target and resets tracking for the new level.
export function advanceToNextLevel(record: ExerciseMasteryRecord): ExerciseMasteryRecord {
  if (!record.mastered || record.next_target === null) return record;
  return {
    exercise_id: record.exercise_id,
    current_target: record.next_target,
    attempts: [],
    current_best: record.current_best,
    consistency_score: 0,
    mastered: false,
    next_target: null,
  };
}
