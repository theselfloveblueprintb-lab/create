import type { GeneratedWorkout, WorkoutGoal } from "./workout";
import type { CalendarMode, SelfCareWindow } from "./calendar";

// Domain types for PRD-004 — Crea Intelligence Engine.

export type IntensityTier = "recovery" | "very_light" | "moderate" | "normal" | "full";

// Updated in PRD-008 to match its own reason list exactly (5 values,
// consolidating PRD-004/006's original 6: "Kinderen" -> "Familie",
// "Weinig energie" + "Pijn" -> "Gezondheid"). This is the same underlying
// interaction — RescheduleFlow.tsx was upgraded in place, not duplicated.
export type RescheduleReason = "Werk" | "Familie" | "Gezondheid" | "Onverwachte gebeurtenis" | "Anders";

export interface RescheduleEvent {
  date: string;
  reason: RescheduleReason;
  proposed_new_moment: string;
}

export type ReflectionCompletion = "yes" | "partial" | "no";

export interface DailyReflection {
  date: string;
  completed_plan: ReflectionCompletion;
  feeling_now: string;
  note_for_tomorrow: string;
}

export interface DailyPlan {
  date: string;
  is_recovery_plan: boolean; // Priority 1 safety stop
  is_restart: boolean; // Priority 6 consistency — eased-back-in framing
  intensity_tier: IntensityTier;
  available_minutes: number;
  primary_goal: WorkoutGoal;
  reasoning: string; // short coach-voice summary (kept for backward compat)
  reasoning_bullets: string[]; // PRD-006's explicit "Why?" bullet list — deterministic, built from real signals, not AI-invented
  primary_workout: GeneratedWorkout;
  secondary_activity: string | null; // max one, per PRD
  coach_note: string;
  // PRD-008 additions — all optional/nullable so this stays backward
  // compatible with any caller that doesn't have calendar data yet.
  calendar_mode: CalendarMode | null;
  mode_suggestions: string[]; // e.g. travel-safe audio activities — see lib/calendar/modeSuggestions.ts
  recommended_window: SelfCareWindow | null;
}

// Explicit table from PRD-004 — deterministic, not AI-judged.
export const ENERGY_TO_TIER: Record<number, IntensityTier> = {
  1: "recovery",
  2: "very_light",
  3: "moderate",
  4: "normal",
  5: "full",
};

export const TIER_ORDER: IntensityTier[] = ["recovery", "very_light", "moderate", "normal", "full"];

// Caps how much of the available time a tier actually uses — a "recovery"
// day never fills a full 45-minute slot just because it was free.
export const TIER_MINUTE_CAP: Record<IntensityTier, number> = {
  recovery: 15,
  very_light: 20,
  moderate: 35,
  normal: 60,
  full: 90,
};

// ---- PRD-006 additions ----

export type ReadinessCategory = "Excellent" | "Good" | "Moderate" | "Limited" | "Recovery Required";

export interface DailyReadinessScore {
  category: ReadinessCategory;
  numeric_score: number; // 0-100, internal use only — never shown to the user as a score
  tier: IntensityTier; // maps 1:1 to category, reuses PRD-004's tier system
}

export interface Mission {
  id: string;
  name: string;
  target_date: string | null;
  emphasis_skill_tags: string[]; // fed into Workout Engine goal-to-skill mapping
  description: string;
}

// Local, localStorage-backed shape — deliberately matches
// types/db/index.ts's DbCoachMemory field-for-field so a future swap to
// the real Supabase table is an adapter change, not a type change.
//
// PRD-007 note: this replaces the 8-type taxonomy introduced in PRD-006
// with PRD-007's authoritative 6 types. types/db/index.ts and
// supabase/migrations/0002_update_coach_memory_types.sql were updated to
// match — see MIGRATION_PLAN.md / README for the reconciliation note.
export type CoachMemoryType =
  | "schedule_pattern" | "energy_pattern" | "exercise_preference"
  | "recovery_pattern" | "motivation_pattern" | "lifestyle_pattern";
export type CoachMemoryStatus = "suggested" | "confirmed" | "rejected" | "expired";

export interface LocalCoachMemory {
  id: string;
  memory_type: CoachMemoryType;
  statement: string;
  supporting_evidence: string;
  confidence_score: number;
  observation_count: number; // "observed multiple times" before it's worth asking about
  status: CoachMemoryStatus;
  user_disabled: boolean; // distinct from status — a still-true memory the user asked not to use
  first_observed_at: string;
  last_confirmed_at: string | null;
}

export interface ReasoningLine {
  text: string; // one bullet in the "Why?" explanation, e.g. "Je hebt goed geslapen."
}
