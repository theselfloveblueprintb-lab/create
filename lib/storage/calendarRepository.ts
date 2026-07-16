import { localStorageAdapter } from "./localStorageAdapter";
import type { WeeklyTemplate } from "@/types/calendar";

const TEMPLATE_KEY = "crea:weekly-availability-template";
const AD_HOC_EVENTS_KEY = "crea:ad-hoc-calendar-events"; // one-off additions, e.g. "unexpected meeting today"

// Seeded from the weekly pattern already established in Evelien's
// profile context (Mon home, Tue half-day second job, Wed work+aqua,
// Thu/Fri work+commute, Sat chores, Sun family) — sensible defaults,
// fully editable in /calendar-setup, not a hidden assumption.
const DEFAULT_TEMPLATE: WeeklyTemplate = [
  { day_of_week: 0, blocks: [
    { start_time: "09:00", end_time: "21:00", availability_type: "family", work_location: null, label: "Familie / eigen tijd" },
  ]},
  { day_of_week: 1, blocks: [
    { start_time: "09:00", end_time: "17:00", availability_type: "work", work_location: "home", label: "Werk (thuis)" },
    { start_time: "12:00", end_time: "12:30", availability_type: "flexible", work_location: null, label: "Lunchpauze" },
  ]},
  { day_of_week: 2, blocks: [
    { start_time: "09:00", end_time: "13:00", availability_type: "work", work_location: "office", label: "Tweede baan (halve dag)" },
    { start_time: "13:00", end_time: "17:00", availability_type: "flexible", work_location: null, label: "Vrij" },
  ]},
  { day_of_week: 3, blocks: [
    { start_time: "09:00", end_time: "17:00", availability_type: "work", work_location: "office", label: "Werk" },
    { start_time: "19:00", end_time: "19:45", availability_type: "busy", work_location: null, label: "Aquafitness" },
  ]},
  { day_of_week: 4, blocks: [
    { start_time: "08:00", end_time: "09:00", availability_type: "travel", work_location: null, label: "Forensen naar Rotterdam" },
    { start_time: "09:00", end_time: "17:00", availability_type: "work", work_location: "office", label: "Werk" },
    { start_time: "17:00", end_time: "18:00", availability_type: "travel", work_location: null, label: "Forensen naar Den Haag" },
  ]},
  { day_of_week: 5, blocks: [
    { start_time: "08:00", end_time: "09:00", availability_type: "travel", work_location: null, label: "Forensen naar Rotterdam" },
    { start_time: "09:00", end_time: "17:00", availability_type: "work", work_location: "office", label: "Werk" },
    { start_time: "17:00", end_time: "18:00", availability_type: "travel", work_location: null, label: "Forensen naar Den Haag" },
  ]},
  { day_of_week: 6, blocks: [
    { start_time: "09:00", end_time: "13:00", availability_type: "busy", work_location: null, label: "Huishouden" },
    { start_time: "13:00", end_time: "18:00", availability_type: "flexible", work_location: null, label: "Vrij" },
  ]},
];

export async function getWeeklyTemplate(): Promise<WeeklyTemplate> {
  return (await localStorageAdapter.get<WeeklyTemplate>(TEMPLATE_KEY)) ?? DEFAULT_TEMPLATE;
}

export async function saveWeeklyTemplate(template: WeeklyTemplate): Promise<void> {
  await localStorageAdapter.set(TEMPLATE_KEY, template);
}

// "Emergency Replanning" / "a new meeting appears" — one-off additions
// layered on top of the recurring template for a specific date, without
// editing the template itself.
export interface AdHocEvent {
  date: string;
  start_time: string;
  end_time: string;
  label: string;
}

export async function getAdHocEvents(date: string): Promise<AdHocEvent[]> {
  const all = (await localStorageAdapter.get<AdHocEvent[]>(AD_HOC_EVENTS_KEY)) ?? [];
  return all.filter((e) => e.date === date);
}

export async function addAdHocEvent(event: AdHocEvent): Promise<void> {
  const all = (await localStorageAdapter.get<AdHocEvent[]>(AD_HOC_EVENTS_KEY)) ?? [];
  all.push(event);
  await localStorageAdapter.set(AD_HOC_EVENTS_KEY, all);
}

// Privacy — "delete calendar history" / "disconnect at any moment".
export async function clearAllCalendarData(): Promise<void> {
  await localStorageAdapter.set(TEMPLATE_KEY, null);
  await localStorageAdapter.set(AD_HOC_EVENTS_KEY, []);
}
