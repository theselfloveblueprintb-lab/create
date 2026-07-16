import { createRepository } from "./createRepository";
import { getSupabaseServerClient } from "../supabaseClient";
import type { DbExerciseAttempt } from "@/types/db";

const base = createRepository<DbExerciseAttempt>("exercise_attempt", "attempt_id");

export const exerciseAttemptRepository = {
  ...base,
  async listBySession(workoutSessionId: string): Promise<DbExerciseAttempt[]> {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("exercise_attempt")
      .select("*")
      .eq("workout_session_id", workoutSessionId)
      .order("attempted_at", { ascending: true });
    if (error) throw error;
    return (data ?? []) as DbExerciseAttempt[];
  },

  // "High pain during an exercise must trigger a safety review before
  // recommending it again" — this flags it; the actual review/exclusion
  // logic belongs in the Workout Engine's safety filter (PRD-003), not here.
  async hasRecentHighPain(userId: string, exerciseId: string, painThreshold: number): Promise<boolean> {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("exercise_attempt")
      .select("attempt_id")
      .eq("user_id", userId)
      .eq("exercise_id", exerciseId)
      .gte("pain_during_score_optional", painThreshold)
      .order("attempted_at", { ascending: false })
      .limit(1);
    if (error) throw error;
    return (data ?? []).length > 0;
  },
};
