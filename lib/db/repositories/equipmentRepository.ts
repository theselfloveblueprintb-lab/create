import { createRepository } from "./createRepository";
import { getSupabaseServerClient } from "../supabaseClient";
import type { DbEquipmentProfile, EquipmentType } from "@/types/db";

const base = createRepository<DbEquipmentProfile>("equipment_profile", "equipment_profile_id");

export const equipmentRepository = {
  ...base,
  async setAvailable(userId: string, equipmentType: EquipmentType, available: boolean): Promise<void> {
    const supabase = getSupabaseServerClient();
    const { error } = await supabase
      .from("equipment_profile")
      .upsert({ user_id: userId, equipment_type: equipmentType, available }, { onConflict: "user_id,equipment_type" });
    if (error) throw error;
  },
};
