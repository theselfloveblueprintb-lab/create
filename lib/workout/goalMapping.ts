import type { PrimaryGoal } from "@/types/profile";

// Maps the onboarding's free-form primary goal (PRD-002) to the skill
// tags used for candidate scoring in the Workout Engine (PRD-003).
export function goalToSkillTags(goal: PrimaryGoal | null): string[] {
  switch (goal) {
    case "Harbor Run":
      return ["Harbor Run readiness", "obstakel voorbereiding"];
    case "Afvallen":
      return ["uithoudingsvermogen"];
    case "Fitter worden":
      return ["uithoudingsvermogen", "kracht"];
    case "Kracht opbouwen":
      return ["kracht"];
    case "Herstellen van blessure":
      return ["herstel", "stabiliteit"];
    case "Meer energie":
      return ["herstel"];
    default:
      return [];
  }
}

export function parseAvailableMinutes(value: string | null): number {
  if (!value) return 20;
  const match = value.match(/\d+/);
  return match ? parseInt(match[0], 10) : 20; // "Wisselt" or unparseable -> conservative default
}
