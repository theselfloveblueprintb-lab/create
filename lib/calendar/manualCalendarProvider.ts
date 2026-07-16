import type { CalendarProvider } from "./calendarProvider";
import type { CalendarBlock } from "@/types/calendar";
import { getWeeklyTemplate, getAdHocEvents } from "@/lib/storage/calendarRepository";

// The one CalendarProvider that's genuinely real today. Expands the
// user's recurring weekly template into concrete dated blocks for a
// given day, then merges in any ad-hoc additions (e.g. "unexpected
// meeting today") layered on top without touching the template itself.
export const manualCalendarProvider: CalendarProvider = {
  providerName: "Handmatig",
  isConfigured: true,

  async getBlocksForDate(date: string): Promise<CalendarBlock[]> {
    const dayOfWeek = new Date(date + "T12:00:00").getDay();
    const template = await getWeeklyTemplate();
    const dayTemplate = template.find((d) => d.day_of_week === dayOfWeek);

    const templateBlocks: CalendarBlock[] = (dayTemplate?.blocks ?? []).map((b, i) => ({
      ...b,
      id: `template-${date}-${i}`,
      date,
      source: "manual",
    }));

    const adHoc = await getAdHocEvents(date);
    const adHocBlocks: CalendarBlock[] = adHoc.map((e, i) => ({
      id: `adhoc-${date}-${i}`,
      date,
      start_time: e.start_time,
      end_time: e.end_time,
      availability_type: "busy",
      source: "manual",
      work_location: null,
      label: e.label,
    }));

    return [...templateBlocks, ...adHocBlocks].sort((a, b) => a.start_time.localeCompare(b.start_time));
  },
};
