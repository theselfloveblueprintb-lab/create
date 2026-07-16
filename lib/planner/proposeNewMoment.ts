import type { RescheduleReason } from "@/types/planner";
import { AGENDA_CONTEXT } from "@/lib/constants";

// Fallback heuristic — used only if the real calendar recalculation
// (lib/calendar/dynamicReschedule.ts, PRD-008) throws. Updated to match
// PRD-008's 5-value reason list.
export function proposeNewMoment(reason: RescheduleReason): string {
  switch (reason) {
    case "Werk":
      return "Zullen we het proberen tijdens je lunchpauze, of vanavond na werk?";
    case "Familie":
      return "Misschien lukt een korte versie zodra er weer even rust is?";
    case "Gezondheid":
      return "Laten we het vandaag rustig houden — we proberen het opnieuw zodra het beter voelt.";
    case "Onverwachte gebeurtenis":
      return "Geen probleem — kies zelf een moment dat vandaag nog past, of morgen.";
    case "Anders":
    default:
      return "Kies een moment dat vandaag beter uitkomt — ik pas het plan aan.";
  }
}

export function agendaContextForPrompt(): string {
  return AGENDA_CONTEXT;
}
