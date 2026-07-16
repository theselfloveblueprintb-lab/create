// Domain types for PRD-002 — User Profile Engine.
// Kept separate from types/checkin.ts (Module 1) so the two modules
// never need to know about each other's internals.

export type Gender = "vrouw" | "man" | "anders" | "zeg_ik_liever_niet" | null;

export type MedicalClearance = "yes" | "no" | "not_sure";

export type EquipmentOption =
  | "Geen"
  | "Yogamat"
  | "Dumbbells"
  | "Weerstandsbanden"
  | "Loopband"
  | "Hometrainer"
  | "Roeitrainer"
  | "Sportschoolabonnement"
  | "Zwembad"
  | "Anders";

export type CalendarProvider = "google" | "apple" | "outlook" | null;

export type WearableProvider =
  | "apple_watch"
  | "garmin"
  | "fitbit"
  | "samsung_health"
  | "polar"
  | "anders"
  | null;

export type PrimaryGoal =
  | "Harbor Run"
  | "Afvallen"
  | "Fitter worden"
  | "Kracht opbouwen"
  | "Herstellen van blessure"
  | "Meer energie"
  | "Anders";

export type AvailableTime = "10 minuten" | "20 minuten" | "30 minuten" | "45 minuten" | "60 minuten" | "Wisselt";

export type CoachStyle = "gentle" | "direct" | "strict";

export interface UserProfile {
  // Step 2 — Personal information
  first_name: string;
  date_of_birth: string; // ISO date
  height_cm: number | null;
  weight_kg: number | null;
  gender: Gender;
  timezone: string;

  // Step 3 — Health
  injuries: string;
  limitations: string;
  recovery_status: string;
  medical_clearance: MedicalClearance | null;

  // Step 4 — Equipment
  equipment: EquipmentOption[];

  // Step 5 — Calendar
  calendar_provider: CalendarProvider;
  calendar_connected: boolean;

  // Step 6 — Smartwatch
  wearable_provider: WearableProvider;
  wearable_connected: boolean;

  // Step 7-10
  primary_goal: PrimaryGoal | null;
  motivation_statement: string;
  available_time: AvailableTime | null;
  coach_style: CoachStyle | null;

  onboarding_completed: boolean;
}

export const EMPTY_PROFILE: UserProfile = {
  first_name: "",
  date_of_birth: "",
  height_cm: null,
  weight_kg: null,
  gender: null,
  timezone: typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "Europe/Amsterdam",

  injuries: "",
  limitations: "",
  recovery_status: "",
  medical_clearance: null,

  equipment: [],

  calendar_provider: null,
  calendar_connected: false,

  wearable_provider: null,
  wearable_connected: false,

  primary_goal: null,
  motivation_statement: "",
  available_time: null,
  coach_style: null,

  onboarding_completed: false,
};

export type OnboardingStepId =
  | "welcome"
  | "personal"
  | "health"
  | "equipment"
  | "calendar"
  | "smartwatch"
  | "goal"
  | "why"
  | "time"
  | "coach_style"
  | "finish";

export const ONBOARDING_STEP_ORDER: OnboardingStepId[] = [
  "welcome",
  "personal",
  "health",
  "equipment",
  "calendar",
  "smartwatch",
  "goal",
  "why",
  "time",
  "coach_style",
  "finish",
];
