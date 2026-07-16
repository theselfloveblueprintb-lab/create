import { localStorageAdapter } from "@/lib/storage/localStorageAdapter";
import type { LocalCoachMemory, CoachMemoryType, CoachMemoryStatus } from "@/types/planner";
import { confidenceFromObservations, ASK_CONFIRMATION_THRESHOLD, HIGH_CONFIDENCE_THRESHOLD } from "./confidenceScoring";

// localStorage-backed Coach Memory — field-compatible with PRD-005's
// db.coach_memory table (post-migration-0002 shape). "New memories begin
// as suggested" and "the user can view, edit or delete every memory" are
// enforced here as the only mutation paths.
//
// Development Notes (PRD-007): this module is deliberately independent —
// it never imports from planningSequence.ts or the Workout Engine.
// Consumers (Planner, future Notification/Habit engines) import FROM
// here, never the reverse.

const MEMORY_KEY = "crea:coach-memory";
const SUPPRESSIONS_KEY = "crea:memory-suppressions"; // statements the user said "never ask again" about
const LEARNING_ENABLED_KEY = "crea:learning-enabled";

export async function listMemories(): Promise<LocalCoachMemory[]> {
  return (await localStorageAdapter.get<LocalCoachMemory[]>(MEMORY_KEY)) ?? [];
}

export async function isLearningEnabled(): Promise<boolean> {
  const val = await localStorageAdapter.get<boolean>(LEARNING_ENABLED_KEY);
  return val ?? true; // on by default
}

export async function setLearningEnabled(enabled: boolean): Promise<void> {
  await localStorageAdapter.set(LEARNING_ENABLED_KEY, enabled);
}

async function getSuppressions(): Promise<string[]> {
  return (await localStorageAdapter.get<string[]>(SUPPRESSIONS_KEY)) ?? [];
}

export async function suppressStatement(statement: string): Promise<void> {
  const list = await getSuppressions();
  if (!list.includes(statement)) {
    list.push(statement);
    await localStorageAdapter.set(SUPPRESSIONS_KEY, list);
  }
}

// Called by detectPatterns.ts. Respects "disable learning completely" and
// "never ask again" — both silently prevent new suggestions, never error.
export async function suggestMemory(
  memory_type: CoachMemoryType,
  statement: string,
  supporting_evidence: string
): Promise<void> {
  if (!(await isLearningEnabled())) return;
  const suppressions = await getSuppressions();
  if (suppressions.includes(statement)) return;

  const all = await listMemories();
  const existing = all.find((m) => m.statement === statement && m.status !== "rejected");

  if (existing) {
    existing.observation_count += 1;
    existing.confidence_score = confidenceFromObservations(existing.observation_count);
    await localStorageAdapter.set(MEMORY_KEY, all);
    return;
  }

  all.push({
    id: crypto.randomUUID(),
    memory_type,
    statement,
    supporting_evidence,
    confidence_score: confidenceFromObservations(1),
    observation_count: 1,
    status: "suggested",
    user_disabled: false,
    first_observed_at: new Date().toISOString(),
    last_confirmed_at: null,
  });
  await localStorageAdapter.set(MEMORY_KEY, all);
}

// "Crea occasionally asks" — only memories that have earned enough
// evidence, aren't disabled, and haven't already been decided on.
export async function getMemoriesPendingConfirmation(): Promise<LocalCoachMemory[]> {
  const all = await listMemories();
  return all.filter(
    (m) => m.status === "suggested" && !m.user_disabled && m.confidence_score >= ASK_CONFIRMATION_THRESHOLD
  );
}

// What the Planner actually reads. Confirmed memories always qualify;
// unconfirmed ones only if they've crossed the high-confidence bar — and
// even then, planningSequence.ts must present them to the AI as
// tentative, not fact (see confidenceScoring.ts comment).
export async function listMemoriesForPlanning(): Promise<LocalCoachMemory[]> {
  const all = await listMemories();
  return all.filter(
    (m) =>
      !m.user_disabled &&
      (m.status === "confirmed" || (m.status === "suggested" && m.confidence_score >= HIGH_CONFIDENCE_THRESHOLD))
  );
}

// "Yes" button
export async function confirmMemory(id: string): Promise<void> {
  const all = await listMemories();
  const updated = all.map((m) =>
    m.id === id ? { ...m, status: "confirmed" as CoachMemoryStatus, last_confirmed_at: new Date().toISOString() } : m
  );
  await localStorageAdapter.set(MEMORY_KEY, updated);
}

// "Not really" button — rejects this instance, but a future independent
// observation could suggest it again (no suppression).
export async function rejectMemory(id: string): Promise<void> {
  const all = await listMemories();
  const updated = all.map((m) => (m.id === id ? { ...m, status: "rejected" as CoachMemoryStatus } : m));
  await localStorageAdapter.set(MEMORY_KEY, updated);
}

// "Never ask again" button — rejects AND permanently suppresses this
// exact statement from ever being re-suggested.
export async function rejectAndSuppressMemory(id: string): Promise<void> {
  const all = await listMemories();
  const memory = all.find((m) => m.id === id);
  if (memory) await suppressStatement(memory.statement);
  await rejectMemory(id);
}

// Dashboard "Edit" — user can correct the wording without losing history.
export async function editMemoryStatement(id: string, newStatement: string): Promise<void> {
  const all = await listMemories();
  const updated = all.map((m) => (m.id === id ? { ...m, statement: newStatement } : m));
  await localStorageAdapter.set(MEMORY_KEY, updated);
}

// Dashboard "Disable" — still true, just not used. Distinct from delete/reject.
export async function setMemoryDisabled(id: string, disabled: boolean): Promise<void> {
  const all = await listMemories();
  const updated = all.map((m) => (m.id === id ? { ...m, user_disabled: disabled } : m));
  await localStorageAdapter.set(MEMORY_KEY, updated);
}

// Dashboard "Delete" — actually removes it, not a status change.
export async function deleteMemory(id: string): Promise<void> {
  const all = await listMemories();
  await localStorageAdapter.set(MEMORY_KEY, all.filter((m) => m.id !== id));
}

// "If behaviour changes" -> Expired. Called manually from the dashboard
// for now — automatic expiry (detecting that a pattern stopped holding)
// isn't built yet; flagged as a reasonable future addition, not faked here.
export async function expireMemory(id: string): Promise<void> {
  const all = await listMemories();
  const updated = all.map((m) => (m.id === id ? { ...m, status: "expired" as CoachMemoryStatus } : m));
  await localStorageAdapter.set(MEMORY_KEY, updated);
}

// Privacy — "users may export memories."
export async function exportMemoriesAsJson(): Promise<string> {
  const all = await listMemories();
  return JSON.stringify(all, null, 2);
}
