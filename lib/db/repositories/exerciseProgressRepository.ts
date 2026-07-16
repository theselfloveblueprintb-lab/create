import { createRepository } from "./createRepository";
import { getSupabaseServerClient } from "../supabaseClient";
import type { DbExerciseProgress } from "@/types/db";

const base = createRepository<DbExerciseProgress>("exercise_progress", "exercise_progress_id");

export const exerciseProgressRepository = {
  ...base,
  async getForExercise(userId: string, exerciseId: string): Promise<DbExerciseProgress | null> {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("exercise_progress")
      .select("*")
      .eq("user_id", userId)
      .eq("exercise_id", exerciseId)
      .maybeSingle();
    if (error) throw error;
    return data as DbExerciseProgress | null;
  },

  // Mirrors the mastery rule already implemented in lib/workout/masteryEngine.ts
  // (PRD-003) — that logic doesn't move here, this just persists its result.
  async recordAttemptResult(
    userId: string,
    exerciseId: string,
    patch: Partial<DbExerciseProgress>
  ): Promise<DbExerciseProgress> {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("exercise_progress")
      .upsert(
        { user_id: userId, exercise_id: exerciseId, last_attempt_at: new Date().toISOString(), ...patch },
        { onConflict: "user_id,exercise_id" }
      )
      .select()
      .single();
    if (error) throw error;
    return data as DbExerciseProgress;
  },
};
