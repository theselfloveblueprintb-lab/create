-- PRD-007 — Coach Memory Engine
-- Replaces the 8-type memory_type taxonomy from 0001 with PRD-007's
-- authoritative 6-type list, and adds two columns PRD-007 requires that
-- 0001 didn't anticipate. Written as a new migration rather than editing
-- 0001 in place, per standard practice — even though nothing is deployed
-- yet, this is the pattern to keep once it is.

-- Drop the old CHECK constraint (name inferred from Postgres's default
-- naming; confirm the actual constraint name via \d coach_memory if this
-- errors on a real database — default naming can vary by PG version).
alter table coach_memory drop constraint if exists coach_memory_memory_type_check;

alter table coach_memory
  add constraint coach_memory_memory_type_check
  check (memory_type in (
    'schedule_pattern', 'energy_pattern', 'exercise_preference',
    'recovery_pattern', 'motivation_pattern', 'lifestyle_pattern'
  ));

-- New columns PRD-007 requires:
alter table coach_memory add column if not exists observation_count integer not null default 1;
alter table coach_memory add column if not exists user_disabled boolean not null default false;

-- Any existing rows using the old 8-type values would violate the new
-- constraint. Since nothing is deployed yet (per MIGRATION_PLAN.md) this
-- is a non-issue today — if it ever isn't, a data-mapping UPDATE must run
-- BEFORE this migration, not after. Left as a comment rather than a
-- guessed mapping, since old->new isn't a clean 1:1 (e.g. "preference"
-- and "constraint" don't map obviously to any single new type).
