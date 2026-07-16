import { localStorageAdapter } from "./localStorageAdapter";
import type { RescheduleEvent, DailyReflection, DailyPlan } from "@/types/planner";

const RESCHEDULES_KEY = "crea:reschedules";
const REFLECTIONS_KEY = "crea:reflections";
const PLANS_KEY = "crea:daily-plans";

export async function getRecentReschedules(limit = 10): Promise<RescheduleEvent[]> {
  const list = (await localStorageAdapter.get<RescheduleEvent[]>(RESCHEDULES_KEY)) ?? [];
  return list.slice(-limit);
}

export async function saveReschedule(event: RescheduleEvent): Promise<void> {
  const list = (await localStorageAdapter.get<RescheduleEvent[]>(RESCHEDULES_KEY)) ?? [];
  list.push(event);
  await localStorageAdapter.set(RESCHEDULES_KEY, list);
}

export async function getRecentReflections(limit = 10): Promise<DailyReflection[]> {
  const list = (await localStorageAdapter.get<DailyReflection[]>(REFLECTIONS_KEY)) ?? [];
  return list.slice(-limit);
}

export async function saveReflection(reflection: DailyReflection): Promise<void> {
  const list = (await localStorageAdapter.get<DailyReflection[]>(REFLECTIONS_KEY)) ?? [];
  list.push(reflection);
  await localStorageAdapter.set(REFLECTIONS_KEY, list);
}

export async function saveDailyPlan(plan: DailyPlan): Promise<void> {
  const list = (await localStorageAdapter.get<DailyPlan[]>(PLANS_KEY)) ?? [];
  list.push(plan);
  await localStorageAdapter.set(PLANS_KEY, list.slice(-30));
}

// Lets other screens (Training) reuse the same plan /today already
// generated today, instead of triggering a second AI call for the same day.
export async function getTodaysPlan(): Promise<DailyPlan | null> {
  const list = (await localStorageAdapter.get<DailyPlan[]>(PLANS_KEY)) ?? [];
  const today = new Date().toISOString().slice(0, 10);
  const todays = list.filter((p) => p.date === today);
  return todays.length > 0 ? todays[todays.length - 1] : null;
}
