import type { CalendarBlock } from "@/types/calendar";

// Every calendar source — manual entry today, real OAuth providers once
// they exist — implements this interface. Nothing downstream (scoring,
// mode detection, the Planner) ever knows or cares which implementation
// it's talking to.
export interface CalendarProvider {
  readonly providerName: string;
  readonly isConfigured: boolean; // true for Manual; false for unconfigured OAuth stubs
  getBlocksForDate(date: string): Promise<CalendarBlock[]>;
}
