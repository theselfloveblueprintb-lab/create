import type { CheckinEntry } from "@/types/checkin";
import type { UserProfile } from "@/types/profile";
import { FOOT_PAIN_SAFETY_THRESHOLD } from "@/types/workout";

// PRD-006 separates Priority 1 (Safety — today's acute signals) from
// Priority 2 (Health — ongoing profile-level constraints). PRD-004 had
// merged these into one check; this splits them as specified.

export interface SafetyResult {
  safetyCompromised: boolean; // today's acute state — stops everything
  healthConstrained: boolean; // ongoing limitation — shapes but doesn't necessarily stop
  reasons: string[];
}

export function evaluateSafetyAndHealth(profile: UserProfile, todayCheckin: CheckinEntry | null): SafetyResult {
  const reasons: string[] = [];

  // Priority 1 — Safety: acute, today-specific. The 0-10 score is the
  // primary gate; a self-reported "severe_pain" category also trips it
  // even if the score is entered lower, per instruction ("pain score OR
  // safety rules require it"). "awaiting_assessment" alone does NOT
  // trip this — it's informational, never an automatic block, and never
  // implies a diagnosis.
  const footPain = todayCheckin?.foot_pain ?? 0;
  const acutePainScore = footPain >= FOOT_PAIN_SAFETY_THRESHOLD;
  const selfReportedSevere = todayCheckin?.foot_status === "severe_pain";
  const notCleared = profile.medical_clearance === "no";
  const safetyCompromised = acutePainScore || selfReportedSevere || notCleared;

  if (acutePainScore) reasons.push(`Voetpijn vandaag is ${footPain}/10 — dat is boven de veilige grens.`);
  if (selfReportedSevere && !acutePainScore) reasons.push("Je gaf zelf 'hevige pijn' aan — we houden het voorzichtig.");
  if (notCleared) reasons.push("Je bent nog niet vrijgegeven door je dokter.");
  if (todayCheckin?.foot_status === "awaiting_assessment") {
    reasons.push("Je wacht nog op een medische beoordeling — geen diagnose, we baseren de training gewoon op hoe je voet vandaag voelt.");
  }

  // Priority 2 — Health: ongoing, profile-level (injuries/limitations text,
  // or recovery_status set). Doesn't stop the day by itself, but the
  // Workout Engine's equipment/injury filtering already respects it —
  // this just surfaces it for the reasoning explanation.
  const healthConstrained = Boolean(profile.injuries || profile.limitations || profile.recovery_status);
  if (profile.injuries) reasons.push(`Gemelde blessure: ${profile.injuries}.`);
  if (profile.limitations) reasons.push(`Gemelde beperking: ${profile.limitations}.`);
  if (profile.recovery_status) reasons.push(`Herstellend van: ${profile.recovery_status}.`);

  return { safetyCompromised, healthConstrained, reasons };
}
