import type { Mission } from "@/types/planner";
import type { PrimaryGoal } from "@/types/profile";
import { RACE_DATE } from "@/lib/constants"; // read-only reuse of Module 1's constant, not a Module 1 file edit

// Satisfies "Future Compatibility" — mission-specific logic (target date,
// what skills to emphasize) lives in config here, not hardcoded inline in
// the planning sequence. Adding "Half Marathon" later means adding an
// entry to this registry, not touching planningSequence.ts.
const MISSIONS: Record<string, Mission> = {
  "Harbor Run": {
    id: "harbor-run",
    name: "Harbor Run",
    target_date: RACE_DATE.toISOString().slice(0, 10),
    emphasis_skill_tags: ["Harbor Run readiness", "obstakel voorbereiding"],
    description: "10km hardlopen + obstakels",
  },
  "Afvallen": {
    id: "weight-loss",
    name: "Afvallen",
    target_date: null,
    emphasis_skill_tags: ["uithoudingsvermogen"],
    description: "Gewichtsverlies via consistente cardio en dagelijkse keuzes",
  },
  "Fitter worden": {
    id: "general-fitness",
    name: "Fitter worden",
    target_date: null,
    emphasis_skill_tags: ["uithoudingsvermogen", "kracht"],
    description: "Algemene conditie en fitheid",
  },
  "Kracht opbouwen": {
    id: "strength",
    name: "Kracht opbouwen",
    target_date: null,
    emphasis_skill_tags: ["kracht"],
    description: "Krachtopbouw",
  },
  "Herstellen van blessure": {
    id: "rehabilitation",
    name: "Herstellen van blessure",
    target_date: null,
    emphasis_skill_tags: ["herstel", "stabiliteit"],
    description: "Blessureherstel en stabiliteit",
  },
  "Meer energie": {
    id: "healthy-habits",
    name: "Meer energie",
    target_date: null,
    emphasis_skill_tags: ["herstel"],
    description: "Energie en gezonde gewoontes",
  },
};

const DEFAULT_MISSION: Mission = {
  id: "general",
  name: "Algemeen",
  target_date: null,
  emphasis_skill_tags: [],
  description: "Geen specifieke missie geselecteerd",
};

export function getMissionForGoal(goal: PrimaryGoal | null): Mission {
  if (!goal) return DEFAULT_MISSION;
  return MISSIONS[goal] ?? DEFAULT_MISSION;
}
