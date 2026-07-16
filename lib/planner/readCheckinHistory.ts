import { localStorageAdapter } from "@/lib/storage/localStorageAdapter";
import type { CheckinEntry } from "@/types/checkin";

// Same read-only pattern as lib/workout/getTodayCheckin.ts — reads
// Module 1's storage key directly via the generic adapter. No Module 1
// file is imported or modified.
const CHECKINS_KEY = "crea:checkins";

export async function getRecentCheckinHistory(limit = 7): Promise<CheckinEntry[]> {
  const list = (await localStorageAdapter.get<CheckinEntry[]>(CHECKINS_KEY)) ?? [];
  return list.slice(-limit);
}
