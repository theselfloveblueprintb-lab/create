import { createRepository } from "./createRepository";
import { getSupabaseServerClient } from "../supabaseClient";
import type { DbWeightEntry } from "@/types/db";

const base = createRepository<DbWeightEntry>("weight_entry", "weight_entry_id");

export const weightEntryRepository = {
  ...base,
  async listForRange(userId: string, fromDate: string, toDate: string): Promise<DbWeightEntry[]> {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("weight_entry")
      .select("*")
      .eq("user_id", userId)
      .gte("measurement_date", fromDate)
      .lte("measurement_date", toDate)
      .order("measurement_date", { ascending: true });
    if (error) throw error;
    return (data ?? []) as DbWeightEntry[];
  },
};
