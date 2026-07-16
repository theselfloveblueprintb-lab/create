import type { EnergyLevel } from "@/types/checkin";
import { ENERGY_TO_TIER, TIER_ORDER, type IntensityTier } from "@/types/planner";

// Module 1's check-in stores energy as a 5-point mood enum, not a numeric
// 1-5 scale. This is a read-only translation layer — Module 1's type and
// UI are untouched; this just maps its output onto PRD-004's scale.
const ENERGY_ENUM_TO_SCALE: Record<EnergyLevel, number> = {
  uitgeput: 1,
  moe: 2,
  gaat_wel: 3,
  goed: 4,
  heel_goed: 5,
};

export function energyEnumToScale(level: EnergyLevel | null): number {
  if (!level) return 3; // no check-in yet today -> assume an average day, never assume the worst
  return ENERGY_ENUM_TO_SCALE[level];
}

export function scaleToTier(scale: number): IntensityTier {
  const clamped = Math.min(5, Math.max(1, Math.round(scale)));
  return ENERGY_TO_TIER[clamped];
}

export function downgradeTier(tier: IntensityTier): IntensityTier {
  const index = TIER_ORDER.indexOf(tier);
  return TIER_ORDER[Math.max(0, index - 1)];
}
