import { createRepository } from "./createRepository";
import { getSupabaseServerClient } from "../supabaseClient";
import type { DbDailyReflection } from "@/types/db";

const base = createRepository<DbDailyReflection>("daily_reflection", "reflection_id");

export const reflectionRepository = {
  ...base,
  async getForDate(userId: string, reflectionDate: string): Promise<DbDailyReflection | null> {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("daily_reflection")
      .select("*")
      .eq("user_id", userId)
      .eq("reflection_date", reflectionDate)
      .maybeSingle();
    if (error) throw error;
    return data as DbDailyReflection | null;
  },
};
