// Core domain types for the Morning Check-in module (PRD Module 1).
// Kept separate from UI so future modules (evening reflection, weekly
// review, etc.) can reuse the same check-in shape.

export type EnergyLevel = "heel_goed" | "goed" | "gaat_wel" | "moe" | "uitgeput";

export type BodyStatus = "Fris" | "Licht stijf" | "Erg stijf";

// Replaces the old binary "waiting"/"cleared" toggle (which defaulted to
// "waiting" with no UI to ever change it — every plan silently assumed
// worst-case foot injury). This is a direct, explicit instruction to
// change Module 1 — see chat for why that supersedes the earlier
// "don't touch Module 1" rule.
export type FootStatus = "no_pain" | "mild_discomfort" | "moderate_pain" | "severe_pain" | "awaiting_assessment";

export interface CheckinEntry {
  date: string; // ISO date, e.g. 2026-07-10
  energy_level: EnergyLevel | null;
  sleep_score: number | null; // 1-5
  stress_level: number; // 0-10
  foot_pain: number; // 0-10 — kept alongside the category, per instruction
  foot_status: FootStatus;
  body_status: BodyStatus | null;
  weight: number | null; // kg, optional
}

export interface DailyPlan {
  hoofddoel: string;
  aanbevolen_training: string;
  duur: string;
  intensiteit: string;
  beste_tijdstip: string;
  waarschuwingen: string;
  alternatief: string;
}

export const EMPTY_ENTRY: Omit<CheckinEntry, "date"> = {
  energy_level: null,
  sleep_score: null,
  stress_level: 5,
  foot_pain: 0,
  foot_status: "no_pain",
  body_status: null,
  weight: null,
};

// Step identifiers drive both the progress dots and the router logic
// inside useCheckinFlow — add a step here first when extending the flow.
export type StepId =
  | "welcome"
  | "energy"
  | "sleep"
  | "stress"
  | "pain"
  | "weight"
  | "smartwatch"
  | "loading"
  | "result";

export const STEP_ORDER: StepId[] = [
  "welcome",
  "energy",
  "sleep",
  "stress",
  "pain",
  "weight",
  "smartwatch",
  "loading",
  "result",
];
