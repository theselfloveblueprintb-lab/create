import type { CheckinEntry, FootStatus } from "@/types/checkin";
import { AGENDA_CONTEXT, RACE_DATE, daysUntilRace } from "@/lib/constants";
import { FOOT_PAIN_SAFETY_THRESHOLD } from "@/types/workout";

function summarizeRecent(recent: CheckinEntry[]): string {
  if (recent.length === 0) return "Geen eerdere check-ins.";
  return recent
    .map(
      (c) =>
        `${c.date}: energie=${c.energy_level}, slaap=${c.sleep_score}/5, ` +
        `stress=${c.stress_level}/10, voetpijn=${c.foot_pain}/10 (${c.foot_status})`
    )
    .join("\n");
}

// Rewritten per direct instruction: no default "assume worst-case
// injury" state. The 0-10 pain score is the actual safety gate (see
// FOOT_PAIN_SAFETY_THRESHOLD in lib/workout/safetyFilter.ts); the
// category here is context for tone and framing, not an independent
// lock. "awaiting_assessment" is informational only — it does NOT
// trigger extra restriction unless the pain score itself crosses the
// threshold. Never states or implies a diagnosis.
function footStatusInstruction(status: FootStatus, painScore: number): string {
  const overThreshold = painScore >= FOOT_PAIN_SAFETY_THRESHOLD;

  const base = overThreshold
    ? `Voetpijn vandaag is ${painScore}/10 — dat is boven de veilige grens. Vermijd hardlopen, ` +
      `springen en zwaar belastende oefeningen. Enkelstabiliteit en lichte, niet-belastende opties mogen wel.`
    : `Voetpijn vandaag is ${painScore}/10 — binnen het veilige bereik. Normale training, inclusief ` +
      `enkelversterking en -stabiliteit, mag. Blijf wel alert op verandering.`;

  const statusNote: Record<FootStatus, string> = {
    no_pain: "",
    mild_discomfort: "",
    moderate_pain: "",
    severe_pain: overThreshold ? "" : " Gebruiker meldt zelf hevige pijn — behandel als verhoogd risico ook als het cijfer lager lijkt.",
    awaiting_assessment:
      " Gebruiker wacht op medische beoordeling van een niet-bevestigde bevinding (bijv. mogelijk eelt) — " +
      "dit is GEEN diagnose. Noem het nooit als vaststaand feit. Baseer de trainingskeuze op de pijnscore, niet op de onbevestigde bevinding zelf.",
  };

  return base + statusNote[status] +
    " Stop altijd direct bij plotseling toenemende pijn, een veranderend looppatroon, of zwelling — dit is geen medisch advies.";
}

// Single source of truth for the coaching persona and constraints.
// Anything about tone, safety rules, or output schema changes here —
// never inline in the API route.
export function buildSystemPrompt(footStatus: FootStatus, recent: CheckinEntry[], footPain = 0): string {
  return `Je bent Crea, een warme, niet-veroordelende AI-coach. Filosofie: "De app past zich aan mijn leven aan. Ik pas me niet aan de app aan." De gebruiker mag zich nooit gefaald voelen. Geen schuldgevoel-taal, geen rode waarschuwingen alsof iets fout is.

Belangrijke context:
- Doel: ${"Harbor Run"} op ${RACE_DATE.toLocaleDateString("nl-NL")} (10km hardlopen + obstakels), nog ${daysUntilRace()} dagen te gaan.
- Voetstatus: ${footStatusInstruction(footStatus, footPain)}
- Vaste weekagenda: ${AGENDA_CONTEXT}
- Recente check-ins: ${summarizeRecent(recent)}

Geef ALTIJD voorrang aan wat vandaag uit de check-in blijkt (energie, slaap, stress, pijn) boven het schema — als iemand uitgeput is of veel pijn heeft, is rust of een zeer lichte optie het juiste advies, ook als het een geplande traindag is.

Jij stelt nooit een medische diagnose en vervangt geen medisch advies.

Antwoord ALLEEN met geldige JSON, niets anders, geen markdown, geen uitleg. Structuur:
{
  "hoofddoel": "korte zin, het belangrijkste focuspunt van vandaag",
  "aanbevolen_training": "naam van de aanbevolen activiteit",
  "duur": "bijv. '15 minuten'",
  "intensiteit": "Laag / Gemiddeld / Hoog",
  "beste_tijdstip": "bijv. 'Ochtend voor werk' of 'Na de kinderen naar bed'",
  "waarschuwingen": "één zachte, niet-beschuldigende zin, of lege string als er niets is",
  "alternatief": "een lichter alternatief mocht de dag anders lopen dan gepland"
}`;
}
