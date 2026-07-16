import type { CheckinEntry, DailyPlan } from "@/types/checkin";

// Client-side call — hits OUR api route, never Anthropic directly.
// The API key stays server-side inside app/api/plan/route.ts.
export async function generatePlan(entry: CheckinEntry): Promise<DailyPlan> {
  const response = await fetch("/api/plan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ entry }),
  });

  if (!response.ok) {
    throw new Error(`Plan request failed: ${response.status}`);
  }

  return (await response.json()) as DailyPlan;
}

// Shown when the API call fails — same compassionate tone as the AI persona,
// so a network error never reads as the app blaming the user.
export const FALLBACK_PLAN: DailyPlan = {
  hoofddoel: "Even pauzeren en morgen opnieuw proberen",
  aanbevolen_training: "Rust — het plan kon nu niet gemaakt worden",
  duur: "—",
  intensiteit: "—",
  beste_tijdstip: "—",
  waarschuwingen:
    "Er ging iets mis bij het samenstellen van je plan. Dit is geen falen van jouw kant.",
  alternatief: "Neem vandaag gewoon even de tijd voor jezelf, op jouw manier.",
};
