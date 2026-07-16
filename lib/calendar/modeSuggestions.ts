import type { CalendarMode } from "@/types/calendar";

// Static, curated suggestion lists matching PRD-008's own examples
// exactly. Deliberately not AI-generated — these are safety-relevant
// (never physical exercise while driving) and PRD-008 gave explicit,
// finished lists; inventing variations would add risk for no benefit.
const SUGGESTIONS: Record<CalendarMode, string[]> = {
  travel: [
    "Brain Training (alleen audio, hands-free)",
    "Audio-reflectie",
    "Podcast-samenvatting hardop",
    "Ademhalingsoefening bij een stoplicht of parkeerplek",
  ],
  office: [
    "Sta even op",
    "Drink een glas water",
    "5 minuten mobiliteit",
    "Enkeloefeningen onder het bureau",
    "Wandelvergadering, indien mogelijk",
  ],
  home_office: [
    "Volledige workout",
    "Stretchpauze",
    "Lunchwandeling",
    "Krachtsessie",
  ],
  weekend: [], // handled via longer/morning-preferred windows, not a fixed suggestion list
  holiday: [
    "Beweging die je leuk vindt — geen prestatiedruk",
    "Herstel",
    "Iets wat energie geeft",
  ],
  normal: [],
};

export function getModeSuggestions(mode: CalendarMode): string[] {
  return SUGGESTIONS[mode];
}

// Never physical exercise while driving — this is a hard rule, not a
// suggestion, so it's enforced as a boolean the Planner can check rather
// than left implicit in the suggestion list alone.
export function physicalExerciseAllowed(mode: CalendarMode): boolean {
  return mode !== "travel";
}
