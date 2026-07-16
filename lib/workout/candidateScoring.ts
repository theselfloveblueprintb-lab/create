import type { Exercise, ExerciseMasteryRecord } from "@/types/workout";

// Implements AI Rules #2-4 (Consistency > Goal Progress > Variety) as
// actual code, not just prompt instructions. Safety (#1) already happened
// in safetyFilter.ts before this runs. Intensity (#5) is left to the AI's
// final composition since it depends on today's energy/stress, which this
// scoring layer doesn't see.

export interface ScoredCandidate {
  exercise: Exercise;
  mastery: ExerciseMasteryRecord;
  score: number;
}

export function scoreCandidates(
  candidates: Exercise[],
  masteryByExerciseId: Record<string, ExerciseMasteryRecord>,
  recentExerciseIds: string[],
  goalSkillTags: string[]
): ScoredCandidate[] {
  return candidates
    .map((exercise) => {
      const mastery = masteryByExerciseId[exercise.id];
      let score = 0;

      // Consistency: prioritize exercises that are actively being worked
      // toward mastery (attempted before, not yet mastered) over ones
      // never touched or already mastered-and-idle.
      if (mastery) {
        if (!mastery.mastered && mastery.attempts.length > 0) score += 3;
        if (mastery.attempts.length === 0) score += 1; // new, worth introducing
        if (mastery.mastered) score += 0.5; // still eligible, just lower priority
      }

      // Goal progress: exercises whose target_skills match the workout's
      // goal-relevant skill tags rank higher.
      const matchesGoal = exercise.target_skills.some((s) => goalSkillTags.includes(s));
      if (matchesGoal) score += 2;

      // Variety: penalize exercises used in the last few workouts.
      if (recentExerciseIds.includes(exercise.id)) score -= 2;

      return { exercise, mastery, score };
    })
    .sort((a, b) => b.score - a.score);
}
