import { localStorageAdapter } from "./localStorageAdapter";
import type { CheckinEntry } from "@/types/checkin";

// Thin repository layer on top of the storage adapter. Components and
// hooks call these functions, not the adapter directly — keeps storage
// keys and shape-versioning in one place.
//
// getFootStatus/setFootStatus (a separate "waiting"/"cleared" toggle,
// defaulting to "waiting" with no UI to ever change it) were removed
// here. foot_status is now part of CheckinEntry itself, chosen fresh
// each day in PainStep — no hidden persistent state that could silently
// keep assuming worst-case injury.

const CHECKINS_KEY = "crea:checkins";
const WEIGHT_KEY = "crea:weight-entries";

export async function getRecentCheckins(limit = 5): Promise<CheckinEntry[]> {
  const list = (await localStorageAdapter.get<CheckinEntry[]>(CHECKINS_KEY)) ?? [];
  return list.slice(-limit);
}

export async function saveCheckin(entry: CheckinEntry): Promise<void> {
  const list = (await localStorageAdapter.get<CheckinEntry[]>(CHECKINS_KEY)) ?? [];
  list.push(entry);
  await localStorageAdapter.set(CHECKINS_KEY, list);

  if (entry.weight) {
    const weights =
      (await localStorageAdapter.get<{ date: string; weight: number }[]>(WEIGHT_KEY)) ?? [];
    weights.push({ date: entry.date, weight: entry.weight });
    await localStorageAdapter.set(WEIGHT_KEY, weights);
  }
}

// Read-only accessor for the Progress screen (finalization phase) —
// weight entries were already being written on every check-in, just
// never read back anywhere until now.
export async function getWeightHistory(): Promise<{ date: string; weight: number }[]> {
  return (await localStorageAdapter.get<{ date: string; weight: number }[]>(WEIGHT_KEY)) ?? [];
}
