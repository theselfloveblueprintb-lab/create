import type { ScoredCandidate } from "@/lib/workout/candidateScoring";
import type { UserProfile } from "@/types/profile";
import type { CheckinEntry } from "@/types/checkin";

// Single source of truth for the Workout Engine's AI composition step.
// The AI may ONLY select and sequence exercises from the candidate list —
// it cannot invent new exercises, names, or safety instructions. That
// constraint is enforced here in the prompt AND validated again server-side
// after the response comes back (see app/api/workout/generate/route.ts).
export function buildWorkoutSystemPrompt(
  profile: UserProfile,
  todayCheckin: Pick<CheckinEntry, "energy_level" | "stress_level" | "foot_pain"> | null,
  availableMinutes: number,
  candidates: ScoredCandidate[]
): string {
  const candidateList = candidates
    .map(
      (c) =>
        `${c.exercise.id} | ${c.exercise.name} | categorie=${c.exercise.category} | ` +
        `type=${c.exercise.prescription_type} | huidig_doel=${c.mastery?.current_target ?? c.exercise.base_target} | ` +
        `sets=${c.exercise.base_sets} | duur_per_set_min=${c.exercise.estimated_duration_min} | ` +
        `gemasterd=${c.mastery?.mastered ?? false} | score=${c.score.toFixed(1)}`
    )
    .join("\n");

  const readiness = todayCheckin
    ? `Energie vandaag: ${todayCheckin.energy_level}, stress: ${todayCheckin.stress_level}/10, voetpijn: ${todayCheckin.foot_pain}/10.`
    : "Geen check-in data voor vandaag beschikbaar — ga uit van een gemiddelde dag.";

  return `Je bent de Workout Engine van Crea. Filosofie: niet "welke workout geef ik", maar "welke workout heeft deze persoon vandaag nodig". De gebruiker mag zich nooit gefaald voelen — geen strafgerichte taal.

Gebruikersprofiel:
- Doel: ${profile.primary_goal}
- Coachstijl: ${profile.coach_style}
- Beschikbare tijd vandaag: ${availableMinutes} minuten
- Blessures: ${profile.injuries || "geen gemeld"}
- Beperkingen: ${profile.limitations || "geen gemeld"}
- Medische vrijgave: ${profile.medical_clearance ?? "onbekend"}

${readiness}

KANDIDATEN (dit zijn de ENIGE oefeningen die je mag gebruiken — verzin nooit een nieuwe oefening of pas de safety_instructions/naam niet aan):
${candidateList}

Bouw een workout met exact deze structuur:
1. Warm-up: 5-10 minuten, uit cardio/mobility kandidaten.
2. Hoofdgedeelte: vult de resterende beschikbare tijd, gebruik het doel en de scores om te kiezen.
3. Cooldown: 5 minuten, uit mobility/recovery kandidaten (stretching, ademhaling, herstel).

Kies exact ÉÉN hoofddoel voor de hele workout uit: "Improve Cardio", "Increase Strength", "Improve Recovery", "Build Mobility", "Increase Harbor Run Readiness".

Antwoord ALLEEN met geldige JSON, geen markdown:
{
  "primary_goal": "...",
  "warmup": [{"exercise_id": "...", "prescribed_target": 0, "prescribed_sets": 0}],
  "main": [{"exercise_id": "...", "prescribed_target": 0, "prescribed_sets": 0}],
  "cooldown": [{"exercise_id": "...", "prescribed_target": 0, "prescribed_sets": 0}],
  "coach_note": "één korte, warme zin passend bij de coachstijl"
}

prescribed_target moet gebaseerd zijn op het "huidig_doel" van elke kandidaat (nooit hoger, tenzij gemasterd).`;
}
