import { localStorageAdapter } from "@/lib/storage/localStorageAdapter";
import type { CheckinEntry } from "@/types/checkin";

// Read-only access to Module 1's check-in data, via the same generic
// storage adapter Module 1 uses. Deliberately NOT importing from
// lib/storage/checkinRepository.ts or touching any Module 1 file —
// this just reads the same key directly.
const CHECKINS_KEY = "crea:checkins";

export async function getTodayCheckin(): Promise<CheckinEntry | null> {
  const list = (await localStorageAdapter.get<CheckinEntry[]>(CHECKINS_KEY)) ?? [];
  const today = new Date().toISOString().slice(0, 10);
  const todays = list.filter((c) => c.date === today);
  return todays.length > 0 ? todays[todays.length - 1] : null;
}
