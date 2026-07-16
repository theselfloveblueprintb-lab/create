# Crea — Deployment Guide

Finalization pass (PRD-010). This document is the single source of truth
for running Crea locally, installing it on a phone, and deploying it to
Vercel. For architecture/module history, see `README.md`. For the
Supabase migration plan, see `MIGRATION_PLAN.md`.

---

## 1. What's genuinely working right now

- **Full user flow**: onboarding → morning check-in → AI-generated daily
  plan → start/pause/resume/finish a real workout session → reps/time
  recorded → mastery and completion history updated → daily reflection.
  First-time vs. returning users are routed correctly from `/`.
- **Navigation**: Today / Check-in / Training / Progress / Profile, all
  real, all reachable, no dead links.
- **Foot/ankle logic**: corrected per your direct instruction — no more
  default "assume worst-case injury" state. Daily foot-status category
  (no pain -> awaiting assessment) plus the 0-10 score, both feeding real
  AI reasoning and the Workout Engine's safety filter. No diagnosis
  language anywhere.
- **PWA**: real manifest, real service worker (API routes explicitly
  excluded from caching), real offline fallback, install prompts for
  both Android (native `beforeinstallprompt`) and iOS (instructional,
  since Apple doesn't expose an install-prompt API).
- **API hardening**: every AI-calling route has input validation, a hard
  timeout, rate limiting, and a deterministic non-AI fallback so the app
  stays usable if the API is down or the daily budget is spent.
- **Coach Memory, Calendar Intelligence (Manual Mode), Planner
  Algorithm**: all live, all reading/writing real data, all documented
  in `README.md` module-by-module.

## 2. What's still mocked or incomplete — read this before you trust anything else

- **No real authentication exists.** Every "user" is just whoever has
  this browser open. The Supabase schema and repository layer from
  PRD-005 are real, runnable code, but nothing calls them yet.
- **Supabase is not connected.** `NEXT_PUBLIC_SUPABASE_URL` /
  `SUPABASE_SERVICE_ROLE_KEY` are unset by default; the app runs entirely
  on `localStorage`. If you set those env vars without also building
  auth and wiring the repositories in, nothing changes — the app still
  uses `localStorage`. Don't be misled by their presence in `.env.example`.
- **Google/Apple/Outlook Calendar are unconfigured stubs.** Selecting
  them in onboarding just falls back to Manual Mode silently. Only
  Manual Mode (`/calendar-setup`) is real.
- **Smartwatch/wearable connections are UI-only.** No device sync exists
  for any provider.
- **Rate limiting is in-memory, not distributed.** It resets on every
  redeploy or cold start and isn't shared across concurrent server
  instances. Fine for one person testing; not a real production
  rate limiter.
- **PWA icons are generated placeholders** (solid ink background, clay
  heart mark) — functional for install-testing, not a final brand asset.
- **I did not run a real build.** This sandbox has no network access, so
  `npm install`, `next build`, `tsc --noEmit`, and `eslint` were never
  actually executed. Section 8 below is from careful manual/static
  review, not a real build log — treat it accordingly and run the real
  commands yourself before deploying.

## 3. Local test commands

```bash
npm install
cp .env.example .env.local
# edit .env.local — at minimum, set ANTHROPIC_API_KEY
npm run dev
```

Open `http://localhost:3000` — it redirects to `/onboarding` on first
visit, `/today` after that.

To actually verify the build (recommended before deploying, since I
could not run this myself):

```bash
npm run build
npm run lint
npx tsc --noEmit
```

## 4. Vercel deployment steps

1. Push this project to a GitHub/GitLab/Bitbucket repo.
2. In Vercel: **New Project** -> import the repo. Framework preset
   `Next.js` is auto-detected.
3. **Environment Variables** (Project Settings -> Environment Variables):
   - `ANTHROPIC_API_KEY` — required
   - `DAILY_AI_REQUEST_LIMIT` — optional, defaults to 150
   - Leave the three `SUPABASE_*` vars unset unless you've actually done
     the Supabase setup in `MIGRATION_PLAN.md` first
4. Build command: `next build` (default — no override needed).
5. Deploy. No `vercel.json` is required for this project; Next.js App
   Router routes, the manifest, and the service worker are all served
   correctly by Vercel's default Next.js handling.
6. Once deployed, open the production URL on your phone and run the
   installation steps below.

## 5. Environment variables reference

| Variable | Required | Exposed to browser | Notes |
|---|---|---|---|
| `ANTHROPIC_API_KEY` | Yes | No | App falls back to deterministic non-AI content if unset or invalid, but every plan/workout will use the fallback, not real AI. |
| `DAILY_AI_REQUEST_LIMIT` | No | No | Defaults to 150. Tune down for a stricter personal test budget. |
| `NEXT_PUBLIC_SUPABASE_URL` | No (unused today) | Yes | Only meaningful once auth + repositories are wired in. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | No (unused today) | Yes | Same. |
| `SUPABASE_SERVICE_ROLE_KEY` | No (unused today) | **Never** | Full DB access — server-only, always. |

## 6. Supabase setup instructions (only if you're ready for account mode)

See `MIGRATION_PLAN.md` for the full context. Short version:

1. Create a Supabase project.
2. `supabase link` this repo to it, then `supabase db push` to run
   `supabase/migrations/0001_init_schema.sql`, `0002_...`, `0003_...`
   in order.
3. Set the three `SUPABASE_*` env vars.
4. **Stop here** — auth doesn't exist yet, so the app still won't
   actually use any of this. Building real sign-up/login, wiring the
   14 MVP repositories into the live app, and migrating existing
   `localStorage` data are all separate, not-yet-done work.

## 7. PWA installation

### Android (Chrome)

1. Open the deployed URL in Chrome.
2. A banner or the in-app "Installeren" prompt appears (via
   `beforeinstallprompt` — `components/pwa/InstallPrompt.tsx`). Tap it.
3. Alternatively: Chrome menu (⋮) -> **Install app** / **Add to Home screen**.
4. Confirm. Crea now opens full-screen from the home screen, no browser
   chrome, using the theme color set in `app/manifest.ts`.

### iPhone (Safari)

Apple doesn't expose an install-prompt API, so this is always manual:

1. Open the deployed URL in **Safari** (not Chrome — iOS install only
   works from Safari).
2. Tap the **Share** icon (square with an arrow) in the toolbar.
3. Scroll down, tap **Add to Home Screen**.
4. Tap **Add**.
5. Open Crea from the home screen icon — it launches standalone
   (`display: standalone`), no Safari address bar.

The in-app instructions (`InstallPrompt.tsx`) show this same guidance
automatically on iOS Safari, and hide themselves once standalone mode
is detected or the user dismisses them.

## 8. Production-readiness checklist

Honest pass/fail — anything I couldn't actually verify without running
real tooling is marked as such, not guessed.

| Check | Result | Notes |
|---|---|---|
| TypeScript compiles | Not verifiable here | No network access to install deps/run `tsc`. Found and fixed one real type-mismatch bug (missing `DailyPlan` fields) via manual review — run `npx tsc --noEmit` yourself before deploying. |
| Production build succeeds | Not verifiable here | Same constraint — run `npm run build` yourself. |
| Lint passes | Not verifiable here | Same constraint. |
| No broken routes | Pass | Every `Link`/nav `href` cross-checked against actual `app/**/page.tsx` files — all matched. |
| Mobile responsiveness | Pass (manual review) | All screens built at a fixed `max-w-[480px]` mobile-first container, consistent with every prior module. Not tested on a real device. |
| Accessibility basics | Partial | Semantic buttons/labels used throughout; no explicit `aria-live` on loading states, no systematic focus management, no screen-reader pass done. Room for improvement, not blocking for a private test. |
| Empty states | Pass | Progress, Memory Dashboard, and Training all handle "no data yet" explicitly. |
| Loading states | Pass | Every async screen has a spinner or explicit loading text. |
| Error states | Pass | Every fetch has a catch block with a non-blaming message and a retry path. |
| Refresh/navigation persistence | Partial | Data persists via `localStorage` (survives refresh). In-progress workout session state does NOT survive a refresh mid-session — noted, not fixed, given time constraints. |
| Invalid form handling | Partial | Required-field validation exists on Onboarding and Personal Info; numeric inputs elsewhere (weight, reps) aren't range-clamped client-side, only server-side (`validateCheckinEntry.ts`) for the one route that reaches the AI. |
| Offline fallback | Pass | `/offline` + service worker `fetch` handler, API routes explicitly excluded from cache. |
| PWA installability | Pass (manual review) | Valid manifest, real icons at required sizes, service worker registers. Not tested on a real device — do the Android/iPhone checklists below yourself. |
| Dev routes removed | Pass | `/dev/db-test`, `/dev/workout-test`, and their API routes deleted entirely. |
| Debug logs reviewed for personal data | Pass | Every `console.*` call site manually audited — none log full check-in/profile objects, only error objects and route/outcome metadata. |
| API key exposure | Pass | `ANTHROPIC_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` only referenced in server-side files — grepped to confirm zero references in any Client Component. |

### Manual test checklists (run these yourself — I could not)

**Android Chrome:**
- [ ] Fresh install from `beforeinstallprompt` banner
- [ ] App icon appears correctly on home screen
- [ ] Opens standalone (no browser UI)
- [ ] Offline: turn on airplane mode, confirm `/offline` shows instead of a browser error
- [ ] Update flow: deploy a small change, confirm the "Nieuwe versie beschikbaar" banner appears and reload works

**iPhone Safari:**
- [ ] Share -> Add to Home Screen works and produces a correctly-named icon
- [ ] Opens standalone from the home screen (no Safari chrome)
- [ ] Status bar style looks correct against the ink background
- [ ] Install instructions banner disappears once added to home screen

## 9. Deliverables summary

1. Working: see Section 1.
2. Mocked/incomplete: see Section 2.
3. Local test commands: see Section 3.
4. Vercel deployment steps: see Section 4.
5. Environment variables: see Section 5.
6. Android install steps: see Section 7.
7. iPhone install steps: see Section 7.
8. Production-readiness checklist: see Section 8.
9. Updated project zip: provided alongside this document.

---

## 10. Verification Pass (second finalization round)

A dedicated static-verification pass, separate from the finalization
build in Section 8. No features were added — this was pure QA. Full
methodology in chat; summary here.

### What was checked and how

Since this environment cannot run `npm install`/`tsc`/`next build`, every
check below was done by parsing the actual source files (250 `@/`
imports, 75 relative imports, 417 named imports) and cross-referencing
them against real files and exports on disk — not by guessing.

- All `@/` imports resolve to a real file: **250/250 confirmed**
- All relative imports resolve: **75/75 confirmed**
- All named imports match a real export in their target: **417/417
  confirmed** (7 initial flags were false positives from my own script
  not handling inline `type` prefixes — manually verified each of the 7
  targets does export what's imported)
- Case-sensitivity: **0 mismatches** — safe for Vercel's case-sensitive
  Linux filesystem even though local dev on Mac/Windows wouldn't have
  caught a mismatch
- Every `page.tsx`: has a default export — **10/10**
- Every API route: exports a valid HTTP method handler — **3/3**
- Onboarding steps: `ONBOARDING_STEP_ORDER` (11 steps) vs. steps wired
  in `OnboardingFlow.tsx` — **exact match**
- Check-in steps: `STEP_ORDER` (9 steps) vs. steps wired in
  `CheckinFlow.tsx` — **exact match**
- Full routing chain traced end-to-end: `/` → onboarding-complete check
  → `/onboarding` or `/today`; onboarding finish → `/checkin`; check-in
  result → `/today` — **all three hops confirmed present in code**
- `DailyPlan` type (14 fields) vs. the object actually returned by
  `planningSequence.ts` — **exact match**, re-verified field by field
- `GeneratedWorkout`/`PrescribedExercise` construction in both
  `generateWorkoutCore.ts` and `composeFallbackWorkout.ts` — **complete
  in both places**
- `WorkoutCompletionLog` construction in the Training page — **complete**
- `CalendarBlock`/`WeeklyTemplate` shape consistency across
  `calendarRepository.ts` and `calendar-setup/page.tsx` — **consistent**
- PWA: every icon path in `manifest.ts` and `layout.tsx` (6 files) vs.
  actual files in `public/icons/` — **exact match, no missing, no
  orphans**. Service worker's cached app-shell routes (`/`, `/today`,
  `/offline`) all exist as real pages.
- No `TODO`/`FIXME`/`XXX`/`HACK` markers anywhere
- No accidental mock code in production paths — every "stub"/"placeholder"
  hit is either an HTML `placeholder=` form attribute or an intentionally
  documented incomplete integration (Google/Apple/Outlook calendar,
  wearables) — never code that pretends to work
- No hardcoded secrets found
- Every `process.env` reference (5 total) is in a server-only file —
  **zero in any Client Component**
- `/dev/db-test`, `/dev/workout-test`, and their API routes: confirmed
  fully deleted, zero dangling references anywhere

### What I found and fixed

**One real, concrete gap**: `package.json` had a `lint` script
(`next lint`) but `eslint` and `eslint-config-next` were never added to
`devDependencies`, and no ESLint config file existed. Running
`npm run lint` fresh would have failed or hung on an interactive setup
prompt. Fixed: added both dependencies and created `.eslintrc.json`
extending `next/core-web-vitals`.

### What remains genuinely unverifiable without a real build

- **Full TypeScript type-checking.** I confirmed imports/exports/object
  shapes are structurally consistent everywhere I could find a
  meaningful construction site, but `strict: true` in `tsconfig.json`
  also checks things like implicit `any`, function-argument type
  compatibility, and control-flow narrowing that only a real compiler
  pass can fully catch. Run `npx tsc --noEmit`.
- **ESLint, including `react-hooks/exhaustive-deps`.** Several
  components use `useEffect`/`useCallback` (Training, Today, Onboarding,
  Check-in). I did not manually trace every dependency array — that's
  exactly what the linter exists to do. Run `npm run lint`.
- **Actual `next build` output** — tree-shaking, bundle size, any
  build-time-only errors (e.g. `generateStaticParams` issues, edge
  runtime incompatibilities) that don't surface from source review.
- **Runtime behavior of `structuredClone`** in `calendar-setup/page.tsx`
  — a modern JS global, should work fine on Node 18+/modern browsers
  (Vercel's default), but never actually executed here.
- **PWA installability in a real browser** — manifest/service-worker
  correctness reviewed by hand; Chrome's actual installability audit
  (Lighthouse) was never run.

### Exact commands to run locally, in order

```bash
npm install
npx tsc --noEmit
npm run lint
npm run build
npm run dev   # then manually click through onboarding -> checkin -> today -> training -> progress -> profile
```

If all four commands (`tsc`, `lint`, `build`, and a manual click-through)
succeed, the app is ready to deploy.

### Priority checklist

**Priority 1 — must fix before deployment**
- Run the four commands above. Nothing in this codebase can be called
  deployment-ready until at least `tsc --noEmit` and `next build`
  succeed for real — that's the one thing this environment structurally
  cannot confirm for you.

**Priority 2 — recommended before deployment**
- Run `npm run lint` and address any `react-hooks/exhaustive-deps`
  warnings it surfaces.
- Run a real Lighthouse PWA audit in Chrome DevTools against the
  deployed URL.
- Manually test the mid-workout-refresh gap noted in Section 8
  ("Refresh/navigation persistence") — decide if it matters for a
  single-user private test, or fix it before wider use.
- Replace the placeholder PWA icons with real designed assets before
  sharing the install link with anyone else.

**Priority 3 — can wait**
- Accessibility pass (`aria-live` on loading states, focus management).
- Client-side range-clamping on numeric inputs beyond the one route
  that already validates server-side.
- Distributed rate limiting, if this ever moves beyond single-user
  private testing.

### Verdict

Every check that's possible to run without executing real tooling has
been run, and the one concrete bug that surfaced (missing ESLint
dependencies) is fixed. I cannot honestly tell you this is fully
verified — that claim only becomes true once `tsc`, `lint`, and `build`
actually pass on your machine. **I consider this ready for deployment
pending a successful local build.**

