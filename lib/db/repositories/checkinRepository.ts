import { createRepository } from "./createRepository";
import { getSupabaseServerClient } from "../supabaseClient";
import type { DbDailyCheckin } from "@/types/db";

const base = createRepository<DbDailyCheckin>("daily_checkin", "checkin_id");

export const dbCheckinRepository = {
  ...base,
  // "The user may update the check-in later" + unique(user_id, checkin_date)
  // -> upsert on that pair is the correct write pattern, not create().
  async upsertForDate(
    userId: string,
    checkinDate: string,
    fields: Omit<DbDailyCheckin, "checkin_id" | "user_id" | "checkin_date" | "created_at">
  ): Promise<DbDailyCheckin> {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("daily_checkin")
      .upsert(
        { user_id: userId, checkin_date: checkinDate, ...fields },
        { onConflict: "user_id,checkin_date" }
      )
      .select()
      .single();
    if (error) throw error;
    return data as DbDailyCheckin;
  },

  async getByDate(userId: string, checkinDate: string): Promise<DbDailyCheckin | null> {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("daily_checkin")
      .select("*")
      .eq("user_id", userId)
      .eq("checkin_date", checkinDate)
      .maybeSingle();
    if (error) throw error;
    return data as DbDailyCheckin | null;
  },
};
