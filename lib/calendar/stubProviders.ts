import type { CalendarProvider } from "./calendarProvider";
import type { CalendarBlock } from "@/types/calendar";

// Honest stubs — same pattern as PRD-005's Supabase client and PRD-002's
// smartwatch step. Each real integration needs its own OAuth app
// registration and credentials that don't exist yet:
//   Google  -> Google Cloud Console project + OAuth consent screen
//   Outlook -> Microsoft Azure AD app registration
//   Apple   -> no public OAuth Calendar API; third-party access is
//              typically CalDAV, a materially different integration,
//              not a drop-in fourth case of this same interface
//
// These classes exist so the rest of the engine can be written against
// the CalendarProvider interface now, and swapping a real implementation
// in later doesn't touch any calling code.

class UnconfiguredProvider implements CalendarProvider {
  constructor(public readonly providerName: string) {}
  readonly isConfigured = false;

  async getBlocksForDate(): Promise<CalendarBlock[]> {
    throw new Error(
      `${this.providerName} is not configured. OAuth credentials and a token-storage backend ` +
        `(see MIGRATION_PLAN.md) are required before this provider can return real data.`
    );
  }
}

export const googleCalendarProvider: CalendarProvider = new UnconfiguredProvider("Google Calendar");
export const outlookCalendarProvider: CalendarProvider = new UnconfiguredProvider("Outlook Calendar");
export const appleCalendarProvider: CalendarProvider = new UnconfiguredProvider("Apple Calendar");
