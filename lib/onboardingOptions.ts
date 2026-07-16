import type { EquipmentOption, PrimaryGoal, AvailableTime, CoachStyle } from "@/types/profile";

// Static option lists for onboarding steps — centralized so wording
// changes happen in one place, not scattered across step components.

export const EQUIPMENT_OPTIONS: EquipmentOption[] = [
  "Geen",
  "Yogamat",
  "Dumbbells",
  "Weerstandsbanden",
  "Loopband",
  "Hometrainer",
  "Roeitrainer",
  "Sportschoolabonnement",
  "Zwembad",
  "Anders",
];

export const CALENDAR_OPTIONS: { id: "google" | "apple" | "outlook"; label: string }[] = [
  { id: "google", label: "Google Agenda" },
  { id: "apple", label: "Apple Agenda" },
  { id: "outlook", label: "Outlook Agenda" },
];

export const WEARABLE_OPTIONS: { id: "apple_watch" | "garmin" | "fitbit" | "samsung_health" | "polar" | "anders"; label: string }[] = [
  { id: "apple_watch", label: "Apple Watch" },
  { id: "garmin", label: "Garmin" },
  { id: "fitbit", label: "Fitbit" },
  { id: "samsung_health", label: "Samsung Health" },
  { id: "polar", label: "Polar" },
  { id: "anders", label: "Anders" },
];

export const GOAL_OPTIONS: PrimaryGoal[] = [
  "Harbor Run",
  "Afvallen",
  "Fitter worden",
  "Kracht opbouwen",
  "Herstellen van blessure",
  "Meer energie",
  "Anders",
];

export const TIME_OPTIONS: AvailableTime[] = ["10 minuten", "20 minuten", "30 minuten", "45 minuten", "60 minuten", "Wisselt"];

export const COACH_STYLE_OPTIONS: { id: CoachStyle; emoji: string; label: string }[] = [
  { id: "gentle", emoji: "🌸", label: "Gentle" },
  { id: "direct", emoji: "💪", label: "Direct" },
  { id: "strict", emoji: "🔥", label: "Strict" },
];
