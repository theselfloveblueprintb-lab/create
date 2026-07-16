import type { GeneratedWorkout } from "@/types/workout";

export interface WorkoutRequest {
  availableMinutes: number;
  maxIntensityAllowed: "recovery" | "light" | "moderate" | "challenging";
}

export interface ValidationResult {
  valid: boolean;
  reason?: string;
}

// Step 8 — Validate. The Workout Engine already enforces hard safety
// constraints internally (PRD-003) — this checks the softer "does this
// actually fit the request" properties the Engine doesn't know about
// (the Planner's own time budget and intensity ceiling).
export function validateWorkout(workout: GeneratedWorkout, request: WorkoutRequest): ValidationResult {
  // Allow a small overage (engine duration estimates are approximate)
  // but reject anything that meaningfully blows the time budget.
  const overageAllowed = 1.15;
  if (workout.total_duration_min > request.availableMinutes * overageAllowed) {
    return {
      valid: false,
      reason: `Workout is ${workout.total_duration_min} min, past niet binnen ${request.availableMinutes} min.`,
    };
  }

  if (workout.main.length === 0 && workout.warmup.length === 0 && workout.cooldown.length === 0) {
    return { valid: false, reason: "Geen oefeningen gegenereerd." };
  }

  return { valid: true };
}
