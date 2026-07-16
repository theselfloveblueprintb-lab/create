import type { CheckinEntry } from "@/types/checkin";
import type { UserProfile } from "@/types/profile";
import { FOOT_PAIN_SAFETY_THRESHOLD } from "@/types/workout";

// Priority 1 — Safety. Code-enforced, not left to AI judgment, same
// pattern as the Workout Engine's own safety filter. If this trips, the
// day becomes a recovery plan regardless of what energy/goal would
// otherwise suggest.
export function isSafetyCompromised(
  profile: UserProfile,
  todayCheckin: CheckinEntry | null
): boolean {
  const footPain = todayCheckin?.foot_pain ?? 0;
  if (footPain >= FOOT_PAIN_SAFETY_THRESHOLD) return true;
  if (profile.medical_clearance === "no") return true;
  return false;
}
