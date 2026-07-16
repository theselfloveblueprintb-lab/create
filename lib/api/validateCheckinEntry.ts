import type { CheckinEntry } from "@/types/checkin";

// Basic server-side input validation for anything reaching an AI prompt.
// Doesn't replace client-side UX validation — this is the last line of
// defense against a malformed or malicious request body reaching the
// Anthropic call (e.g. a crafted stress_level of 99999, or a giant
// user_note string inflating token cost).
export function validateCheckinEntry(entry: unknown): entry is CheckinEntry {
  if (!entry || typeof entry !== "object") return false;
  const e = entry as Record<string, unknown>;

  if (typeof e.date !== "string" || e.date.length > 20) return false;
  if (typeof e.stress_level !== "number" || e.stress_level < 0 || e.stress_level > 10) return false;
  if (typeof e.foot_pain !== "number" || e.foot_pain < 0 || e.foot_pain > 10) return false;
  if (e.sleep_score !== null && (typeof e.sleep_score !== "number" || e.sleep_score < 1 || e.sleep_score > 5)) return false;
  if (e.weight !== null && (typeof e.weight !== "number" || e.weight <= 0 || e.weight > 400)) return false;

  const validFootStatus = ["no_pain", "mild_discomfort", "moderate_pain", "severe_pain", "awaiting_assessment"];
  if (typeof e.foot_status !== "string" || !validFootStatus.includes(e.foot_status)) return false;

  return true;
}
