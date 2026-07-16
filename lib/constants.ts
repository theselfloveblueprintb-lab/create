export const RACE_NAME = "Harbor Run";
export const RACE_DATE = new Date("2026-10-04T09:00:00");

// Static for now. Once a real calendar integration exists, this becomes
// a fetched value rather than a hardcoded string — the AI prompt builder
// doesn't care where it comes from, so that swap is isolated to one call site.
export const AGENDA_CONTEXT =
  "Vaste week: Ma=thuiswerken, Di=halve dag tweede baan, " +
  "Wo=werk+aquafitness 45min, Do=werk+forensen Den Haag-Rotterdam, " +
  "Vr=werk+forensen, Za=huishouden, Zo=vrije tijd/familie.";

export function daysUntilRace(): number {
  const diff = RACE_DATE.getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}
