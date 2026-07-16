import { getSupabaseServerClient } from "../supabaseClient";
import type { DbUserProfile } from "@/types/db";

// user_profile's primary key IS user_id (1:1 with auth.users), so this
// doesn't use the generic factory's listByUser/getById-by-surrogate-key
// shape — it's a direct get/upsert by user_id.
export const userProfileRepository = {
  async get(userId: string): Promise<DbUserProfile | null> {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase.from("user_profile").select("*").eq("user_id", userId).maybeSingle();
    if (error) throw error;
    return data as DbUserProfile | null;
  },

  async upsert(profile: Omit<DbUserProfile, "created_at" | "updated_at">): Promise<DbUserProfile> {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("user_profile")
      .upsert({ ...profile, updated_at: new Date().toISOString() })
      .select()
      .single();
    if (error) throw error;
    return data as DbUserProfile;
  },

  async delete(userId: string): Promise<void> {
    // Deletes cascade via ON DELETE CASCADE from auth.users, but this
    // supports deleting just the profile row directly if ever needed
    // separately from the auth account (e.g. GDPR data-only erasure
    // while preserving login) — see PRD-005 "allow account and data deletion".
    const supabase = getSupabaseServerClient();
    const { error } = await supabase.from("user_profile").delete().eq("user_id", userId);
    if (error) throw error;
  },
};
