import { createRepository } from "./createRepository";
import { getSupabaseServerClient } from "../supabaseClient";
import type { DbHealthProfile } from "@/types/db";

const base = createRepository<DbHealthProfile>("health_profile", "health_profile_id");

export const healthProfileRepository = {
  ...base,
  // One health profile per user (unique constraint) — this is the
  // realistic access pattern, not listByUser.
  async getByUser(userId: string): Promise<DbHealthProfile | null> {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase.from("health_profile").select("*").eq("user_id", userId).maybeSingle();
    if (error) throw error;
    return data as DbHealthProfile | null;
  },
};
