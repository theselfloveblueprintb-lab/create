# Migration Plan — PRD-005 Data Model

## Why this exists

`localStorage` (used by every module so far) cannot support PRD-005:
no relational integrity, no real users, no encryption, no row-level
access control. Full reasoning is in the chat where this was proposed —
this document is the concrete "what happens next."

**Nothing built before this PRD has been rewired yet.** Modules 1-4
still run entirely on `localStorage`. This PRD adds a parallel,
not-yet-connected data layer: schema + types + repositories, ready to
switch on once the steps below are done.

## What's been built in this PRD

```
supabase/migrations/0001_init_schema.sql   all 21 tables, RLS policies
types/db/index.ts                          TS types matching the schema 1:1
lib/db/supabaseClient.ts                   server-only client (service role)
lib/db/repositories/createRepository.ts    generic CRUD factory
lib/db/repositories/*.ts                   14 MVP-priority repositories
app/api/dev/db-test/route.ts               dev-only CRUD round-trip
app/dev/db-test/page.tsx                   dev-only test page
```

## Steps to actually go live (all require you, not more code from me)

1. **Create a Supabase project.** You've done this before on the
   bewindvoering app — same process.
2. **Run the migration.** `supabase link` to the new project, then
   `supabase db push` (or paste `0001_init_schema.sql` into the SQL
   editor directly).
3. **Set env vars** from `.env.example`: `NEXT_PUBLIC_SUPABASE_URL`,
   `SUPABASE_SERVICE_ROLE_KEY`.
4. **Seed the exercise library.** The 28 exercises in
   `lib/workout/exerciseLibrary.ts` (PRD-003) need to become rows in the
   new `exercise` table — a one-time script, not written yet since it's
   pure data transformation, not architecture.
5. **Decide on authentication** (see "The auth gap" below) before any
   real user can hit these repositories — right now they'll only work
   for a user ID you create manually in Supabase Auth, as in
   `/dev/db-test`.
6. **Only after 1-5**, decide module-by-module whether to switch
   `localStorage` calls over to these repositories, or run both in
   parallel during a transition. That's a real product conversation,
   not something to decide inside a migration doc.

## The auth gap — the biggest open decision

PRD-005's entire model assumes real accounts: "every user owns their
own data," RLS policies keyed on `auth.uid()`. **There is currently no
login screen anywhere in Crea.** The app works today because exactly
one person uses one browser on one device. That assumption breaks the
moment this schema goes live.

I didn't build a login/signup flow in this PRD — that's a genuine new
user-facing feature, which the PRD explicitly told me not to add. But
it's worth naming plainly: the data model is ready, the repositories
are ready, and neither can be used by a real user until an auth flow
exists. That's naturally either the first thing in PRD-006, or its own
unnumbered PRD, but it's a prerequisite, not a detail.

## Reconciliation issues surfaced by writing this schema

These are real seams between what already exists and what PRD-005
specifies. None are silently resolved — flagging each for a decision:

1. **`energy_level` shape.** Module 1 stores a mood enum
   (`heel_goed`/`goed`/.../`uitgeput`); PRD-005 specifies integer 1-5.
   The Planner (PRD-004) already translates one to the other in
   `lib/planner/energyMapping.ts`. The new `daily_checkin` table stores
   the PRD-005 integer shape — meaning a real migration would need to
   translate Module 1's history through that same mapping, not copy it
   as-is.
2. **Exercise IDs.** The seed library (PRD-003) uses short string slugs
   (`"c-walk"`, `"hr-grip"`); the new schema uses `uuid`. Migrating the
   library means generating real UUIDs and updating every place that
   currently hardcodes a slug (mastery records, recent-workout variety
   tracking) — mechanical, but not zero-effort.
3. **Module 1's own plan-generation logic** (`/api/plan`) versus the
   Planner (PRD-004, `/api/planner/generate`) still do overlapping
   jobs. This schema adds a `workout_plan` table that's clearly meant
   for the Planner's output — Module 1's check-in flow was never
   designed to write to it. Unresolved, flagged again here since it's
   now a *data* question, not just a UX one.
4. **`StorageAdapter` vs. real repositories.** The interface I built in
   PRD-001 (`get`/`set` by key) is right for simple blobs — a profile
   object, a mastery-records map. It's the wrong shape for genuinely
   relational data (ordered plan items, attempts joined to sessions).
   That's why this PRD didn't try to implement `SupabaseStorageAdapter`
   as a drop-in replacement — the 14 typed repositories are a
   deliberately different, more appropriate pattern for this layer.

## What I'd need from you to keep going

- Confirmation on the four reconciliation points above
- The Supabase project + env vars
- A decision on auth (build it now as its own PRD, or fold it into
  PRD-006)
