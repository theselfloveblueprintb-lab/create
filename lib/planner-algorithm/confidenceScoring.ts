// Shared confidence math — every detector in detectPatterns.ts calls this
// instead of inventing its own numbers, so confidence is comparable
// across memory types.

// "Observed multiple times" (PRD-007's lifecycle stage) is modeled as
// confidence climbing with repeated observation, not a separate DB status.
export function confidenceFromObservations(observationCount: number): number {
  return Math.min(0.9, 0.3 + observationCount * 0.15);
}

// Below this, a memory isn't even worth surfacing as "suggested" —
// it stays invisible until it's observed again.
export const MIN_SUGGEST_CONFIDENCE = 0.3;

// Above this, Crea will proactively ask the user to confirm it
// ("Crea occasionally asks" — not every visit, only once it's earned enough evidence).
export const ASK_CONFIRMATION_THRESHOLD = 0.6;

// A suggested (not yet confirmed) memory this confident may weakly inform
// planning, per PRD-007's acceptance criteria ("uses only confirmed or
// high-confidence memories") — but it's always presented to the AI as
// tentative, never as settled fact. See lib/ai/plannerSystemPrompt usage
// in planningSequence.ts.
export const HIGH_CONFIDENCE_THRESHOLD = 0.85;
