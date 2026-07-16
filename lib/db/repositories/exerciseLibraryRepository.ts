import { getSupabaseServerClient } from "../supabaseClient";
import type { DbExercise, ExerciseCategory } from "@/types/db";

// Global/shared table, no user_id — read-only for the app, so this
// repository has no create/update/delete. Seeding the library from
// lib/workout/exerciseLibrary.ts into this table is a one-time migration
// script, not part of this repository (see MIGRATION_PLAN.md, step 4).
export const exerciseLibraryRepository = {
  async getById(exerciseId: string): Promise<DbExercise | null> {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase.from("exercise").select("*").eq("exercise_id", exerciseId).maybeSingle();
    if (error) throw error;
    return data as DbExercise | null;
  },

  async listActive(category?: ExerciseCategory): Promise<DbExercise[]> {
    const supabase = getSupabaseServerClient();
    let query = supabase.from("exercise").select("*").eq("active", true);
    if (category) query = query.eq("category", category);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as DbExercise[];
  },
};
