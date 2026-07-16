import type { Exercise } from "@/types/workout";
import { FOOT_PAIN_SAFETY_THRESHOLD } from "@/types/workout";

// Hard, code-enforced constraints — never left to the AI to decide.
// This is what makes "safety always overrides intensity" (AI Rule #1)
// actually true rather than just a prompt instruction.

export function filterByEquipment(exercises: Exercise[], ownedEquipment: string[]): Exercise[] {
  const owned = new Set(ownedEquipment);
  return exercises.filter((e) => e.equipment_required.every((req) => owned.has(req)));
}

// Removes running/jumping/plyometric/obstacle-prep style exercises once
// today's foot pain crosses the configured threshold, regardless of what
// the AI might otherwise choose.
export function filterByInjury(exercises: Exercise[], footPainToday: number): Exercise[] {
  if (footPainToday <= FOOT_PAIN_SAFETY_THRESHOLD) return exercises;
  return exercises.filter((e) => !e.high_impact);
}

export function getSafeCandidates(
  exercises: Exercise[],
  ownedEquipment: string[],
  footPainToday: number
): Exercise[] {
  const equipmentSafe = filterByEquipment(exercises, ownedEquipment);
  return filterByInjury(equipmentSafe, footPainToday);
}
