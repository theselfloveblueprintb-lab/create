import { createRepository } from "./createRepository";
import { getSupabaseServerClient } from "../supabaseClient";
import type { DbGoal } from "@/types/db";

const base = createRepository<DbGoal>("goal", "goal_id");

export const goalRepository = {
  ...base,
  async listActive(userId: string): Promise<DbGoal[]> {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("goal")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("priority", { ascending: true });
    if (error) throw error;
    return (data ?? []) as DbGoal[];
  },
};
