# Crea — Module 1: Morning Check-in

Next.js 14 (App Router) + TypeScript + Tailwind rebuild of the approved PRD prototype.

## Getting started

```bash
npm install
cp .env.example .env.local   # add your ANTHROPIC_API_KEY
npm run dev
```

Open http://localhost:3000 — the landing page links to `/checkin`.

## Folder structure

```
app/
  page.tsx              landing (will list future modules)
  checkin/page.tsx       Module 1 route
  api/plan/route.ts      server-side Claude call — API key lives ONLY here
  layout.tsx, globals.css

components/
  ui/                    reusable, presentation-only primitives
                          (Button, ChoiceCard, SliderInput, StarRating,
                          ProgressDots, BackButton)
  checkin/
    CheckinFlow.tsx       orchestrator — wires hook state to step components
    steps/                one component per PRD screen, dumb & typed

hooks/
  useCheckinFlow.ts       the state machine: navigation, entry state,
                          plan generation, persistence. No JSX in here —
                          keeps it unit-testable independent of the UI.

lib/
  constants.ts            race date, weekly agenda context
  ai/
    systemPrompt.ts        single source of truth for the Crea persona,
                            tone rules, and JSON output schema
    generatePlan.ts        client fetcher — calls our own /api/plan
  storage/
    storageAdapter.ts       interface: get/set only
    localStorageAdapter.ts  v1 implementation (browser-only)
    checkinRepository.ts    the only module that knows storage KEYS

types/
  checkin.ts               CheckinEntry, DailyPlan, StepId, STEP_ORDER
```

## Why it's structured this way

- **Steps are dumb.** Every file in `components/checkin/steps` takes
  props and calls callbacks — no fetch calls, no storage calls, no
  navigation logic. Adding a step for a future module means copying this
  pattern, not learning a new one.
- **One state machine.** `useCheckinFlow` is the only place that knows
  step order, back/forward history, and when to trigger plan generation.
  Reorder `STEP_ORDER` in `types/checkin.ts` and the flow updates itself.
- **Storage behind an interface.** Nothing outside `lib/storage/` calls
  `localStorage` directly. When check-ins need to persist across devices,
  write a `SupabaseStorageAdapter` implementing the same `StorageAdapter`
  interface and swap one import in `checkinRepository.ts` — no component
  changes.
- **AI persona isolated.** `systemPrompt.ts` is the only place tone,
  safety rules (foot status, "never feel like you failed"), and the
  output JSON schema are defined. The API route is a thin transport layer.

## Two things carried over from the prototype that need a decision later

1. **Smartwatch sync** — `SmartwatchStep` always shows "not connected."
   Real device data (HealthKit / Google Fit / Garmin) requires a native
   app or PWA with device permissions; a plain web app can't request them.
   This becomes relevant if Crea ever ships as a native/PWA build.

2. **`checkinRepository` is currently client-only** (localStorage). The
   API route imports `getFootStatus`/`getRecentCheckins` from it for
   convenience, but those calls silently no-op server-side today — the
   client already passes `foot_status` in the request body as the actual
   source of truth. Once there's a database and auth, move these reads
   server-side properly and drop the client-side duplication.

## Design language

Carried over 1:1 from the approved prototype: Fraunces (display) + Inter
(body), and the clay/ink/blush/sage/gold palette — defined once in
`tailwind.config.ts`, referenced everywhere as Tailwind classes rather
than inline hex values.

---

# Module 2: User Profile Engine (PRD-002)

Route: `/onboarding`. Fully separate from Module 1 — no files under
`app/checkin/`, `components/checkin/`, `hooks/useCheckinFlow.ts`, or
`lib/ai/` were touched to build this.

## New files

```
types/profile.ts                  UserProfile, all enums, EMPTY_PROFILE,
                                   ONBOARDING_STEP_ORDER
lib/onboardingOptions.ts           equipment/calendar/wearable/goal/time/
                                   coach-style option lists
lib/storage/profileRepository.ts   get/save/update — same pattern as
                                   checkinRepository.ts
components/ui/TextField.tsx        new primitive: labeled text input
components/ui/TextArea.tsx         new primitive: labeled textarea
hooks/useOnboardingFlow.ts         state machine — mirrors useCheckinFlow
components/onboarding/
  OnboardingFlow.tsx                orchestrator
  steps/*.tsx                       one component per PRD-002 step
app/onboarding/page.tsx
```

Reused without modification: `Button`, `ChoiceCard`, `ProgressDots`,
`BackButton` from `components/ui/`.

## Decisions flagged in chat, not resolved in code

- **Calendar & smartwatch steps are selection-only.** Picking a provider
  stores it and sets `*_connected: false`. No OAuth, no device SDKs —
  that's real backend + credentials work for a future PRD.
- **Health data still goes through `localStorageAdapter`.** Same
  plaintext/client-only limitation as Module 1's storage, now holding
  more sensitive fields (injuries, medical_clearance). Needs a real
  backend before "stored securely" (PRD-002's own requirement) is true.
- **Steps 2 and 3 were built as grouped mini-forms**, not one field per
  screen, to keep onboarding inside the 5-minute target — see chat for
  reasoning.

## Not built (intentionally)

- No Settings screen to edit profile answers later — out of scope for
  this PRD, though `profileRepository.updateProfile()` already supports
  partial patches whenever that screen exists.
- No AI Planner / Workout Engine — waiting on PRD-003 as instructed.
- Module 1 and Module 2 aren't wired together (e.g. redirecting new
  users through onboarding before check-in). That's a cross-module
  routing decision left for when it's actually specified.

---

# Module 3: Workout Engine (PRD-003)

No route of its own — this is a backend engine, as specified. Verify it
via **`/dev/workout-test`**, a diagnostic-only page (clearly marked in
its own source, safe to delete once PRD-004 gives this a real surface).

## New files

```
types/workout.ts                    Exercise, ExerciseMasteryRecord,
                                     GeneratedWorkout, WorkoutCompletionLog,
                                     FOOT_PAIN_SAFETY_THRESHOLD
lib/workout/
  exerciseLibrary.ts                 28 seed exercises across all 6 PRD
                                      categories — expandable, not exhaustive
  masteryEngine.ts                   progression rule: last 3 attempts at/above
                                      target = mastered; next target = ×1.2
  safetyFilter.ts                    equipment + injury filtering — hard,
                                      code-enforced, runs before the AI does
  candidateScoring.ts                consistency/goal/variety scoring
                                      (AI Rules #2-4 as real code)
  composeFallbackWorkout.ts          deterministic safety net if the AI
                                      call fails or returns invalid data
  goalMapping.ts                     profile.primary_goal -> skill tags;
                                      "30 minuten" -> 30
  getTodayCheckin.ts                 read-only lookup into Module 1's
                                      storage key — no Module 1 files touched
  requestWorkout.ts                  client-side orchestration
lib/ai/workoutSystemPrompt.ts        prompt builder — candidates only,
                                      AI cannot invent exercises
lib/storage/workoutRepository.ts     mastery records, completion logs,
                                      recent-workout history (for variety)
app/api/workout/generate/route.ts    server-side: filter -> score -> AI
                                      compose -> validate -> clamp -> return
app/dev/workout-test/page.tsx        dev-only diagnostic screen
```

## How "no hardcoded workouts" was actually implemented

The exercise **library** (28 entries: name, safety instructions, equipment,
tags) is structured seed content — normal software, not a "workout."
What's dynamic, driven entirely by real user + performance data, is:

1. **Filtering** — equipment owned and today's foot pain hard-remove
   unsafe/impossible exercises before anything else happens.
2. **Scoring** — consistency, goal alignment, and variety rank the
   remaining candidates.
3. **AI composition** — Claude selects and sequences from that scored,
   pre-filtered pool into warm-up/main/cooldown, matching available time
   and today's readiness. It cannot introduce an exercise, name, or
   safety instruction that isn't already in the library — the API route
   validates every returned exercise ID against the candidate pool and
   falls back to a deterministic composition if anything doesn't match.
4. **Clamping** — prescribed reps/duration can never exceed the user's
   current mastery target unless that exercise is actually mastered.

## Decisions flagged in chat, not resolved in code

- **`FOOT_PAIN_SAFETY_THRESHOLD = 4`** and the **3-attempt mastery
  window** are both configured constants, not PRD-specified numbers —
  easy to tune in `types/workout.ts` and `masteryEngine.ts`.
- **`animation_ref` is a slug, not an asset.** No animation content
  exists; this field just reserves the shape for when it does.
- **Mastery/completion data is still `localStorage`-only** — same
  unresolved "stored securely" gap as Module 2.

## Not built (intentionally)

- No scheduling / "when" logic — PRD-003 explicitly reserves that for
  the AI Planner (PRD-004).
- No workout-player UI (rep counters, timers, mid-workout failure
  capture) — not specified in this PRD; `/dev/workout-test` exists only
  to prove the engine works, not as that UI.

---

# Module 4: Crea Intelligence Engine (PRD-004)

Route: **`/today`**. This is the first PRD where the Workout Engine
(PRD-003) gets modified — expected, since PRD-003 explicitly deferred
connecting the two systems to this PRD.

## The one real edit to a prior module

`app/api/workout/generate/route.ts` was refactored from containing all
its logic inline to a thin wrapper around a new
`lib/workout/generateWorkoutCore.ts`. Behavior is identical for any
existing caller (`/dev/workout-test` still works exactly as before) —
this only exists so the Planner can call the same pipeline with
Planner-decided overrides (`minutesOverride`, `forcedCategory`,
`goalOverride`) instead of duplicating ~150 lines of filtering/scoring/
validation logic.

## New files

```
types/planner.ts                    DailyPlan, IntensityTier, RescheduleEvent,
                                     DailyReflection, ENERGY_TO_TIER table
lib/planner/
  safetyCheck.ts                     Priority 1 — code-enforced
  energyMapping.ts                   Priority 3 — Module 1 enum -> 1-5 scale
                                      -> tier (deterministic table from PRD)
  recoveryAdjustment.ts              Priority 4 — sleep/stress/soreness/
                                      yesterday's completion -> tier downgrade
  consistencyCheck.ts                Priority 6 — restart detection
  buildLearningSummary.ts            aggregated history -> prompt context
                                      (see honesty note below)
  proposeNewMoment.ts                reschedule heuristic (not an AI call)
  readCheckinHistory.ts              read-only into Module 1's storage key
  requestDailyPlan.ts                client-side orchestration
lib/ai/plannerSystemPrompt.ts        Planner's persona/tone/schema —
                                      decides goal + secondary + reasoning
                                      ONLY; tier/time/safety already fixed
lib/workout/generateWorkoutCore.ts   extracted from the PRD-003 route
lib/storage/plannerRepository.ts     reschedules, reflections, plan history
app/api/planner/generate/route.ts    orchestrates priorities 1-6, calls
                                      generateWorkoutCore, returns DailyPlan
components/planner/
  PlanCard.tsx                        today's plan + reasoning + "why"
  RescheduleFlow.tsx                  "what changed?" -> proposed new moment
  ReflectionForm.tsx                  the exact 3 PRD-specified questions
app/today/page.tsx                   orchestrator: plan / reschedule /
                                      reflection views
```

## What's deterministic vs. AI-decided, and why

| Priority | Decided by | Reasoning |
|---|---|---|
| 1. Safety | Code | Same stance as PRD-003: never trust an LLM with a safety-critical stop/go decision |
| 2. Time | Code | Simple parsing, no judgment needed |
| 3. Energy → tier | Code | PRD-004 gives an exact 1-5 table — that's a lookup, not a decision |
| 4. Recovery | Code | Also an explicit rule (poor sleep/stress/soreness/yesterday → downgrade) |
| 5. Goal | **AI** | Genuinely needs judgment — profile goal + today's full context |
| 6. Consistency | Code detects restart; **AI** frames the coaching tone around it | Detection is a date calculation; the compassionate framing is language, which is what the AI is for |

## Two things flagged, not fully resolved

- **"Learning behaviour" is context-summarization, not machine
  learning.** `buildLearningSummary.ts` aggregates real history
  (average sleep, completion rates, common reschedule reasons,
  yesterday's reflection note) into a text block fed into the next
  prompt. Claude's weights never update — this is honest
  retrieval-augmented context, not a trained personalization model.
  Worth being precise about since "the AI learns" could imply more.
- **Rescheduling proposes a time in prose, not a real calendar slot.**
  `proposeNewMoment.ts` is a reason-based heuristic against the static
  weekly agenda — there's no real calendar data to schedule against yet
  (still a stub since PRD-002). Once that's real, this function's job
  changes from "sound plausible" to "check actual free/busy time."

## Not built (intentionally)

- Module 1's check-in still runs its own separate plan-generation logic
  — flagged at the top of this section, not resolved here.
- No push notifications / end-of-day prompt trigger for the Daily
  Reflection — it's reachable from `/today` any time, not
  automatically surfaced "at the end of the day" since no
  notification infrastructure exists.

---

# Module 5: Crea Data Model (PRD-005)

**See `MIGRATION_PLAN.md` at the repo root** — this module is
primarily an architecture proposal, not a feature. Short version: the
existing `localStorage` layer can't support this PRD's relational,
multi-user, encrypted-at-rest requirements, so this PRD adds a
parallel Postgres/Supabase schema and repository layer without
touching any existing module. Nothing is wired together yet — that's
gated on you provisioning a Supabase project and resolving four
reconciliation issues documented in the migration plan (energy_level
shape, exercise ID scheme, Module 1 vs. Planner overlap, and the fact
that there's no authentication system yet at all).

Test the round-trip once Supabase is live: `/dev/db-test`.

---

# Module 6: Planner Algorithm (PRD-006)

Same route (`/today`) — this PRD replaces the internals of the PRD-004
Planner, not the UI. `PlanCard.tsx` got one additive change (renders a
bullet list instead of a single paragraph, when available); everything
else in `/today` is untouched.

## New files

```
lib/planner-algorithm/
  missions.ts             configurable mission registry (Future Compatibility)
  readinessScore.ts        Step 4 — Excellent/Good/Moderate/Limited/Recovery Required
  safetyAndHealthCheck.ts  Priority 1 (Safety, acute) split from Priority 2 (Health, ongoing)
  validateWorkout.ts       Step 8 — validates fit against time/intensity request
  planningSequence.ts      the algorithm itself — all 9 steps
  coachMemoryStore.ts      localStorage-backed, shape-matches PRD-005's db.coach_memory
  detectPatterns.ts        Learning Rules — suggests (never auto-confirms) memories
```

## What changed from PRD-004 to PRD-006, and why

- **Safety and Health split.** PRD-004 merged "is today unsafe" and "does
  this person have ongoing limitations" into one check. PRD-006 asks for
  two separate priorities — `safetyAndHealthCheck.ts` now returns both,
  with Safety (acute, stops the day) still fully code-enforced.
- **Readiness Score replaces the simple energy→tier lookup.** Now blends
  energy, sleep, stress, pain, and a recovery trend into one internal
  category. Per the PRD, this number is never shown to the user — only
  the resulting plan is.
- **Reasoning is now a real bullet list**, built deterministically from
  actual signals (sleep score, pain score, available time, mission),
  matching the PRD's own example format — not AI free-text, so every
  bullet is traceable to a real data point.
- **A genuine validate-and-retry loop.** Up to 3 attempts, tightening the
  time budget on each failure, before falling back to the Workout
  Engine's own internal safe default.
- **Coach Memory is used, not just defined.** Confirmed memories feed
  into the goal-decision prompt; `detectPatterns.ts` looks for real
  recurring signals (a reschedule reason appearing 3+ times, low energy
  clustering on a weekday) and creates *suggested* memories — never
  auto-confirmed, per PRD-005's own rule.
- **Missions are configuration, not inline logic** — `missions.ts` is the
  single place mission-specific behavior (target date, skill emphasis)
  lives, so a future "Half Marathon" mission is a registry entry, not a
  code change to the planning sequence.

## Fixed during this build

`detectAndSuggestPatterns` was originally called from the server route —
but Coach Memory is `localStorage`-backed, which doesn't exist server-side.
That would have silently done nothing on every request. Moved the call to
`requestDailyPlan.ts` (client-side), where the storage it depends on
actually exists.

## Still not real (flagged again, not resolved here)

- Calendar Availability (Step 3) and Wearable Summary (Step 1) are still
  stubs — Time Analysis falls back to the profile's stated default, same
  as PRD-004.
- Coach Memory lives in `localStorage`, not the PRD-005 Supabase table —
  same shape, different backing store, pending the migration plan.
- "Separate service" was interpreted as a strict module boundary within
  the same app, not a physically separate deployment — see chat.

---

# Finalization Pass (PRD-010)

**See `DEPLOYMENT.md`** for local test commands, Vercel deployment
steps, environment variables, PWA install instructions, and an honest
production-readiness checklist.

Highlights:
- Fixed a real bug: the foot check-in defaulted to assuming worst-case
  injury with no UI to ever change it. Rebuilt per direct instruction —
  the only exception made to "don't touch Module 1" this entire project,
  and it's fully attributable to five files, all directly related to
  that one fix.
- Built the previously-missing pieces of the user flow: a real workout
  session player (`/training`), a Progress screen, a Profile/Settings
  screen, shared navigation, and first-time-vs-returning-user routing.
- Added a full PWA layer: manifest, service worker (API routes
  explicitly never cached), offline fallback, Android + iOS install UI.
- Hardened all three AI-calling routes: input validation, timeouts,
  in-memory rate limiting, deterministic non-AI fallbacks.
- Removed both `/dev` routes and their API endpoints.
- Caught and fixed a real type-mismatch bug during this pass (missing
  `DailyPlan` fields left over from an interrupted PRD-008) — see
  `DEPLOYMENT.md` Section 2 for what that means for verification, since
  no real `tsc`/build could be run in this environment.


---

# Module 7: Coach Memory Engine (PRD-007)

New route: **`/memories`** (the Memory Dashboard). `/today` got one
additive change — a confirmation prompt can appear above the plan when
a pattern has earned enough evidence to ask about.

## New files

```
components/memory/
  MemoryConfirmationPrompt.tsx   the Yes / Not really / Never ask again UI
  MemoryCard.tsx                  dashboard list item — edit/delete/disable
app/memories/page.tsx             Memory Dashboard
lib/planner-algorithm/
  confidenceScoring.ts             shared confidence math + thresholds
supabase/migrations/
  0002_update_coach_memory_types.sql   schema fix for the taxonomy change below
```

## Changed files (all flagged in chat, not silent)

- **`types/planner.ts` / `types/db/index.ts`** — `CoachMemoryType`
  switched from an 8-value list to PRD-007's authoritative 6:
  `schedule_pattern`, `energy_pattern`, `exercise_preference`,
  `recovery_pattern`, `motivation_pattern`, `lifestyle_pattern`. Also
  added `user_disabled` and `observation_count` fields.
- **`lib/planner-algorithm/coachMemoryStore.ts`** — rewritten: adds
  suppression ("never ask again"), a global learning on/off switch,
  `listMemoriesForPlanning()` (confirmed + high-confidence-but-unconfirmed,
  clearly distinguished), and export-to-JSON.
- **`lib/planner-algorithm/detectPatterns.ts`** — expanded from 2
  detectors to 4 real ones (schedule, energy, exercise preference,
  recovery). `motivation_pattern` is explicitly NOT auto-detected — see
  below.
- **`lib/planner-algorithm/planningSequence.ts` / `app/api/planner/generate/route.ts`
  / `lib/planner/requestDailyPlan.ts`** — Coach Memory reads moved
  client-side (see bug note below); the planning module now receives
  memories as a parameter instead of fetching them itself.

## A bug caught before it shipped, twice in a row now

Same class of mistake as PRD-006: I first wrote `planningSequence.ts` to
call `listMemoriesForPlanning()` directly, which is `localStorage`-backed
and would have silently returned nothing every time it ran server-side.
Fixed the same way — moved the read to the client
(`requestDailyPlan.ts`), which now fetches memories and sends them in the
request body. Worth naming the pattern explicitly: **any new code in
`lib/planner-algorithm/` that touches `coachMemoryStore.ts` must be
called from client-side code, never from inside `planningSequence.ts`
or an API route directly.**

## What's honestly NOT auto-detected, and why

- **`motivation_pattern`** ("responds better to encouragement") — PRD-007
  itself says Coach Memory must never guess emotions. Inferring a
  motivational preference from workout completion data alone is exactly
  that kind of guess. This memory type exists in the schema and the
  dashboard can display one if it's ever created some other way, but no
  detector fabricates one from behavior.
- **Water intake / skipping breakfast** (PRD-007's other `lifestyle_pattern`
  examples) — Crea has no nutrition tracking anywhere. Only "forgets
  evening reflection" is detected, because it's the only lifestyle
  signal Crea actually has data for.

## Reconciling PRD-007's memory lifecycle with PRD-005's DB schema

PRD-007 describes: Suggested → Observed multiple times → Confirmed →
Active → Expired. PRD-005's `coach_memory.status` only has 4 values
(`suggested/confirmed/rejected/expired`). Resolution used here:
"Observed multiple times" is confidence climbing *within* the suggested
status (see `confidenceFromObservations`), and "Active" is treated as
synonymous with "confirmed," not a 5th status. "Disable" (from the
dashboard) doesn't fit the status enum either — a disabled memory can
still be true, just unused — so it's a separate `user_disabled` boolean,
not a status value.






