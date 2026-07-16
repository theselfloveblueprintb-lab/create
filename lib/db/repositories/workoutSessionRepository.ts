import { createRepository } from "./createRepository";
import { getSupabaseServerClient } from "../supabaseClient";
import type { DbWorkoutSession } from "@/types/db";

const base = createRepository<DbWorkoutSession>("workout_session", "workout_session_id");

export const workoutSessionRepository = {
  ...base,
  // "A paused workout must be resumable" — find the open session rather
  // than always starting a new one.
  async getActiveSession(userId: string): Promise<DbWorkoutSession | null> {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("workout_session")
      .select("*")
      .eq("user_id", userId)
      .in("session_status", ["started", "paused"])
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data as DbWorkoutSession | null;
  },

  async listRecent(userId: string, limit = 10): Promise<DbWorkoutSession[]> {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("workout_session")
      .select("*")
      .eq("user_id", userId)
      .order("started_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as DbWorkoutSession[];
  },
};
