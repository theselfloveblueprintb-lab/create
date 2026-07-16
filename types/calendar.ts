// Domain types for PRD-008 — Calendar Intelligence Engine.
// CalendarBlock deliberately mirrors PRD-005's availability_block table
// shape (see supabase/migrations/0003_calendar_schema_update.sql for the
// two fields — work_location, and 'holiday' as an availability_type
// value — that PRD-008 needed but 0001 didn't anticipate).

export type AvailabilityType = "free" | "flexible" | "busy" | "travel" | "work" | "family" | "sleep" | "holiday";
export type AvailabilitySource = "calendar" | "manual" | "learned_pattern";
export type WorkLocation = "office" | "home" | null;

export interface CalendarBlock {
  id: string;
  date: string; // ISO date
  start_time: string; // "HH:mm"
  end_time: string;
  availability_type: AvailabilityType;
  source: AvailabilitySource;
  work_location: WorkLocation; // only meaningful when availability_type === "work"
  label: string; // short human description, e.g. "Werk", "Aquafitness"
}

export interface SelfCareWindow {
  start_time: string;
  end_time: string;
  duration_minutes: number;
  score: number; // 0-100 — quality of this window (energy, interruption risk, timing)
  confidence: number; // 0-100 — likelihood this window survives the day intact
  reasons: string[];
}

export type CalendarMode = "normal" | "travel" | "office" | "home_office" | "weekend" | "holiday";

// One day's worth of manually-entered blocks — the recurring weekly
// template a user builds once in /calendar-setup, then Crea expands into
// concrete dated blocks each morning.
export interface WeeklyTemplateDay {
  day_of_week: number; // 0 = Sunday .. 6 = Saturday
  blocks: Omit<CalendarBlock, "id" | "date" | "source">[];
}

export type WeeklyTemplate = WeeklyTemplateDay[];

export type EmergencyReplanReason = "Werk" | "Familie" | "Gezondheid" | "Onverwachte gebeurtenis" | "Anders";
