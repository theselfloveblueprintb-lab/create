import type { CalendarProvider } from "./calendarProvider";
import { manualCalendarProvider } from "./manualCalendarProvider";
import { googleCalendarProvider, outlookCalendarProvider, appleCalendarProvider } from "./stubProviders";
import type { CalendarProvider as ProfileCalendarProvider } from "@/types/profile";

// Reuses the calendar_provider/calendar_connected fields already on
// UserProfile (PRD-002). If the user picked google/apple/outlook during
// onboarding, that selection is honored — but since none of those are
// actually configured yet, this gracefully falls back to Manual rather
// than erroring the whole planning sequence out.
export function getActiveProvider(
  calendarProvider: ProfileCalendarProvider,
  calendarConnected: boolean
): CalendarProvider {
  if (!calendarConnected || !calendarProvider) return manualCalendarProvider;

  const candidate: CalendarProvider =
    calendarProvider === "google" ? googleCalendarProvider
    : calendarProvider === "apple" ? appleCalendarProvider
    : calendarProvider === "outlook" ? outlookCalendarProvider
    : manualCalendarProvider;

  return candidate.isConfigured ? candidate : manualCalendarProvider;
}
