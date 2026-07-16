import { createRepository } from "./createRepository";
import { getSupabaseServerClient } from "../supabaseClient";
import type { DbCoachMemory, CoachMemoryStatus } from "@/types/db";

const base = createRepository<DbCoachMemory>("coach_memory", "coach_memory_id");

export const coachMemoryRepository = {
  ...base,
  // "New memories begin as suggested" — this is the only creation path,
  // enforced here rather than trusting every caller to set status correctly.
  async suggest(memory: Omit<DbCoachMemory, "coach_memory_id" | "status" | "created_at" | "updated_at" | "first_observed_at" | "last_confirmed_at">): Promise<DbCoachMemory> {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("coach_memory")
      .insert({ ...memory, status: "suggested" satisfies CoachMemoryStatus, first_observed_at: new Date().toISOString() })
      .select()
      .single();
    if (error) throw error;
    return data as DbCoachMemory;
  },

  async setStatus(memoryId: string, status: CoachMemoryStatus): Promise<void> {
    const supabase = getSupabaseServerClient();
    const patch: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
    if (status === "confirmed") patch.last_confirmed_at = new Date().toISOString();
    const { error } = await supabase.from("coach_memory").update(patch).eq("coach_memory_id", memoryId);
    if (error) throw error;
  },

  async listConfirmed(userId: string): Promise<DbCoachMemory[]> {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("coach_memory")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "confirmed")
      .order("confidence_score", { ascending: false });
    if (error) throw error;
    return (data ?? []) as DbCoachMemory[];
  },
};
