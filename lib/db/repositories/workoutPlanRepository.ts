import { createRepository } from "./createRepository";
import { getSupabaseServerClient } from "../supabaseClient";
import type { DbWorkoutPlan, DbWorkoutPlanItem, WorkoutPlanStatus } from "@/types/db";

const base = createRepository<DbWorkoutPlan>("workout_plan", "workout_plan_id");

export const workoutPlanRepository = {
  ...base,
  async getForDate(userId: string, planDate: string): Promise<DbWorkoutPlan | null> {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("workout_plan")
      .select("*")
      .eq("user_id", userId)
      .eq("plan_date", planDate)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data as DbWorkoutPlan | null;
  },

  // "A plan may be replaced when circumstances change. Replaced plans
  // must remain in history" — so this never deletes, only marks status.
  async markReplaced(planId: string): Promise<void> {
    const supabase = getSupabaseServerClient();
    const { error } = await supabase.from("workout_plan").update({ status: "replaced" satisfies WorkoutPlanStatus }).eq("workout_plan_id", planId);
    if (error) throw error;
  },

  async setStatus(planId: string, status: WorkoutPlanStatus): Promise<void> {
    const supabase = getSupabaseServerClient();
    const { error } = await supabase.from("workout_plan").update({ status }).eq("workout_plan_id", planId);
    if (error) throw error;
  },

  async addItems(items: Omit<DbWorkoutPlanItem, "workout_plan_item_id">[]): Promise<DbWorkoutPlanItem[]> {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase.from("workout_plan_item").insert(items).select();
    if (error) throw error;
    return (data ?? []) as DbWorkoutPlanItem[];
  },

  async getItems(planId: string): Promise<DbWorkoutPlanItem[]> {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("workout_plan_item")
      .select("*")
      .eq("workout_plan_id", planId)
      .order("sequence_number", { ascending: true });
    if (error) throw error;
    return (data ?? []) as DbWorkoutPlanItem[];
  },
};
