import { localStorageAdapter } from "./localStorageAdapter";
import type { UserProfile } from "@/types/profile";
import { EMPTY_PROFILE } from "@/types/profile";

// Same pattern as checkinRepository.ts: one module owns the storage key,
// everything else goes through these functions.
//
// SECURITY NOTE (see chat): this still writes through localStorageAdapter,
// which is plaintext and client-only. Health fields collected here
// (injuries, medical_clearance, recovery_status) warrant real encrypted
// backend storage once auth exists — flagged, not solved, in this PRD.

const PROFILE_KEY = "crea:profile";

export async function getProfile(): Promise<UserProfile> {
  const stored = await localStorageAdapter.get<UserProfile>(PROFILE_KEY);
  return stored ?? EMPTY_PROFILE;
}

export async function saveProfile(profile: UserProfile): Promise<void> {
  await localStorageAdapter.set(PROFILE_KEY, profile);
}

export async function updateProfile(patch: Partial<UserProfile>): Promise<UserProfile> {
  const current = await getProfile();
  const updated = { ...current, ...patch };
  await saveProfile(updated);
  return updated;
}
