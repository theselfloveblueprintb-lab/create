-- Crea Data Model (PRD-005)
-- Postgres schema for Supabase. Run via `supabase db push` once a project
-- exists — see MIGRATION_PLAN.md at the repo root before applying this.
--
-- Conventions:
--   * Every user-owned table has user_id -> auth.users(id) on delete cascade,
--     with RLS enabled and a single "owner-only" policy (auth.uid() = user_id).
--   * Enums are implemented as text + CHECK constraints rather than native
--     Postgres ENUM types — easier to extend later via ALTER TABLE without
--     the ALTER TYPE ceremony native enums require.
--   * Global/shared tables (exercise library) have no user_id and no RLS
--     write policy for regular users.

create extension if not exists pgcrypto;

-- =========================================================
-- 1. User Profile
-- =========================================================
create table user_profile (
  user_id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null,
  date_of_birth date not null,
  height_cm numeric not null check (height_cm > 0),
  current_weight_kg numeric not null check (current_weight_kg > 0),
  target_weight_kg numeric check (target_weight_kg > 0),
  gender_optional text,
  timezone text not null default 'Europe/Amsterdam',
  coach_style text not null check (coach_style in ('gentle', 'direct', 'strict')),
  primary_goal text not null,
  motivation_statement text,
  default_available_time_minutes integer not null default 20 check (default_available_time_minutes > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table user_profile enable row level security;
create policy "owner_all_user_profile" on user_profile for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =========================================================
-- 2. Health Profile
-- =========================================================
create table health_profile (
  health_profile_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  injuries text[] not null default '{}',
  physical_limitations text[] not null default '{}',
  recovery_status text,
  medical_clearance_status text not null default 'unknown'
    check (medical_clearance_status in ('unknown', 'not_cleared', 'partially_cleared', 'cleared')),
  medical_notes_optional text,
  pain_thresholds jsonb, -- e.g. {"foot": 4, "knee": 5} — flexible per-body-part thresholds
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id) -- one health profile per user
);
alter table health_profile enable row level security;
create policy "owner_all_health_profile" on health_profile for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =========================================================
-- 3. Equipment Profile (one row per equipment type the user has)
-- =========================================================
create table equipment_profile (
  equipment_profile_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  equipment_type text not null check (equipment_type in (
    'yoga_mat', 'dumbbells', 'resistance_bands', 'treadmill', 'exercise_bike',
    'rowing_machine', 'gym_membership', 'swimming_pool', 'none', 'other'
  )),
  quantity_optional integer,
  weight_or_resistance_optional text,
  available boolean not null default true,
  notes_optional text,
  unique (user_id, equipment_type)
);
alter table equipment_profile enable row level security;
create policy "owner_all_equipment_profile" on equipment_profile for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =========================================================
-- 4. Daily Check-in
-- =========================================================
create table daily_checkin (
  checkin_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  checkin_date date not null,
  energy_level integer not null check (energy_level between 1 and 5),
  sleep_score integer not null check (sleep_score between 1 and 5),
  stress_level integer not null check (stress_level between 0 and 10),
  foot_pain_score integer not null check (foot_pain_score between 0 and 10),
  general_pain_score_optional integer check (general_pain_score_optional between 0 and 10),
  body_status text,
  motivation_level_optional integer check (motivation_level_optional between 1 and 5),
  resting_heart_rate_optional integer,
  weight_kg_optional numeric,
  user_note_optional text,
  created_at timestamptz not null default now(),
  unique (user_id, checkin_date) -- "maximum one primary morning check-in per day"
);
alter table daily_checkin enable row level security;
create policy "owner_all_daily_checkin" on daily_checkin for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index idx_daily_checkin_user_date on daily_checkin (user_id, checkin_date desc);

-- =========================================================
-- 5. Calendar Connection (structure prepared, not integrated — PRD-007)
-- =========================================================
create table calendar_connection (
  calendar_connection_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in ('google', 'apple', 'outlook', 'manual')),
  connected boolean not null default false,
  external_account_id text,
  permissions_status text,
  last_sync_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table calendar_connection enable row level security;
create policy "owner_all_calendar_connection" on calendar_connection for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =========================================================
-- 6. Availability Block (structure prepared, not integrated — PRD-007)
-- =========================================================
create table availability_block (
  availability_block_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  duration_minutes integer not null,
  source text not null check (source in ('calendar', 'manual', 'learned_pattern')),
  availability_type text not null check (availability_type in
    ('free', 'flexible', 'busy', 'travel', 'work', 'family', 'sleep')),
  confidence_score numeric(3, 2) check (confidence_score between 0 and 1),
  reserved_for_crea boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_time > start_time)
);
alter table availability_block enable row level security;
create policy "owner_all_availability_block" on availability_block for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index idx_availability_block_user_date on availability_block (user_id, date);

-- =========================================================
-- 7. Goal
-- =========================================================
create table goal (
  goal_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_type text not null check (goal_type in
    ('event', 'fitness', 'weight', 'strength', 'recovery', 'energy', 'habit', 'other')),
  goal_title text not null,
  goal_description text,
  start_date date not null default current_date,
  target_date_optional date,
  target_value_optional numeric,
  current_value_optional numeric,
  priority text not null default 'primary' check (priority in ('primary', 'secondary')),
  status text not null default 'active' check (status in ('active', 'paused', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table goal enable row level security;
create policy "owner_all_goal" on goal for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index idx_goal_user_status on goal (user_id, status);

-- =========================================================
-- 8. Exercise Library (global/shared — not user-owned)
-- =========================================================
create table exercise (
  exercise_id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null check (category in
    ('cardio', 'strength', 'mobility', 'recovery', 'balance', 'ankle_stability',
     'core', 'grip', 'obstacle_skill', 'mindfulness')),
  description text not null,
  instructions text,
  animation_or_media_url_optional text,
  equipment_required text[] not null default '{}',
  difficulty_level text not null check (difficulty_level in ('beginner', 'intermediate', 'advanced')),
  target_muscles text[] not null default '{}',
  target_skills text[] not null default '{}',
  impact_level text not null check (impact_level in ('none', 'low', 'moderate', 'high')),
  weight_bearing boolean not null default true,
  estimated_duration_seconds integer not null,
  default_repetitions_optional integer,
  default_sets_optional integer,
  default_hold_seconds_optional integer,
  safety_instructions text not null,
  contraindications text[] not null default '{}',
  alternative_exercise_ids uuid[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- Read-only for regular users; writes restricted to service role (content team).
alter table exercise enable row level security;
create policy "everyone_can_read_exercise" on exercise for select using (true);

-- =========================================================
-- 9. Exercise Progress
-- =========================================================
create table exercise_progress (
  exercise_progress_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise_id uuid not null references exercise(exercise_id) on delete cascade,
  current_level integer not null default 1,
  current_target numeric not null,
  personal_best numeric not null default 0,
  successful_attempts integer not null default 0,
  recent_attempts_count integer not null default 0,
  mastery_required_successes integer not null default 3, -- default rule: 3 of last 5
  mastered boolean not null default false,
  mastered_at_optional timestamptz,
  next_target_optional numeric,
  last_attempt_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, exercise_id)
);
alter table exercise_progress enable row level security;
create policy "owner_all_exercise_progress" on exercise_progress for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index idx_exercise_progress_user on exercise_progress (user_id);

-- =========================================================
-- 11. Workout Plan  (created before #10 Exercise Attempt, since Attempt
--     references workout_session_id, and Workout Session references
--     workout_plan_id — plan and its items must exist first)
-- =========================================================
create table workout_plan (
  workout_plan_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_date date not null,
  scheduled_start_time_optional timestamptz,
  planned_duration_minutes integer not null,
  primary_goal text not null,
  intensity text not null check (intensity in ('recovery', 'light', 'moderate', 'challenging')),
  reason_for_recommendation text not null, -- "every plan must explain why"
  status text not null default 'proposed' check (status in
    ('proposed', 'accepted', 'rescheduled', 'started', 'completed',
     'partially_completed', 'cancelled', 'replaced')),
  source_checkin_id uuid references daily_checkin(checkin_id) on delete set null,
  source_goal_id_optional uuid references goal(goal_id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table workout_plan enable row level security;
create policy "owner_all_workout_plan" on workout_plan for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index idx_workout_plan_user_date on workout_plan (user_id, plan_date desc);

-- =========================================================
-- 12. Workout Plan Item
-- =========================================================
create table workout_plan_item (
  workout_plan_item_id uuid primary key default gen_random_uuid(),
  workout_plan_id uuid not null references workout_plan(workout_plan_id) on delete cascade,
  exercise_id_optional uuid references exercise(exercise_id) on delete set null,
  item_type text not null check (item_type in
    ('warm_up', 'exercise', 'rest', 'cool_down', 'breathing', 'reflection')),
  sequence_number integer not null,
  planned_sets_optional integer,
  planned_repetitions_optional integer,
  planned_seconds_optional integer,
  planned_distance_optional numeric,
  rest_seconds_optional integer,
  instructions_optional text,
  unique (workout_plan_id, sequence_number)
);
-- RLS via join: only owners of the parent plan may touch its items.
alter table workout_plan_item enable row level security;
create policy "owner_all_workout_plan_item" on workout_plan_item for all
  using (exists (
    select 1 from workout_plan p
    where p.workout_plan_id = workout_plan_item.workout_plan_id and p.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from workout_plan p
    where p.workout_plan_id = workout_plan_item.workout_plan_id and p.user_id = auth.uid()
  ));
create index idx_workout_plan_item_plan on workout_plan_item (workout_plan_id, sequence_number);

-- =========================================================
-- 13. Workout Session
-- =========================================================
create table workout_session (
  workout_session_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workout_plan_id_optional uuid references workout_plan(workout_plan_id) on delete set null,
  started_at timestamptz not null default now(),
  ended_at_optional timestamptz,
  actual_duration_minutes numeric,
  completion_percentage numeric check (completion_percentage between 0 and 100),
  energy_before_optional integer check (energy_before_optional between 1 and 5),
  energy_after_optional integer check (energy_after_optional between 1 and 5),
  pain_before_optional integer check (pain_before_optional between 0 and 10),
  pain_after_optional integer check (pain_after_optional between 0 and 10),
  session_status text not null default 'started' check (session_status in
    ('started', 'paused', 'completed', 'partially_completed', 'stopped_for_safety', 'abandoned')),
  user_notes_optional text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table workout_session enable row level security;
create policy "owner_all_workout_session" on workout_session for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index idx_workout_session_user on workout_session (user_id, started_at desc);

-- =========================================================
-- 10. Exercise Attempt (after Workout Session, which it references)
-- =========================================================
create table exercise_attempt (
  attempt_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workout_session_id uuid not null references workout_session(workout_session_id) on delete cascade,
  exercise_id uuid not null references exercise(exercise_id) on delete cascade,
  attempted_at timestamptz not null default now(),
  target_repetitions_optional integer,
  completed_repetitions_optional integer,
  target_seconds_optional integer,
  completed_seconds_optional integer,
  target_distance_optional numeric,
  completed_distance_optional numeric,
  weight_used_optional numeric,
  form_quality_optional text check (form_quality_optional in ('unknown', 'poor', 'acceptable', 'good')),
  pain_during_score_optional integer check (pain_during_score_optional between 0 and 10),
  difficulty_rating_optional integer check (difficulty_rating_optional between 1 and 5),
  completed boolean not null default false,
  skipped boolean not null default false,
  skip_reason_optional text,
  notes_optional text
);
alter table exercise_attempt enable row level security;
create policy "owner_all_exercise_attempt" on exercise_attempt for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index idx_exercise_attempt_session on exercise_attempt (workout_session_id);
create index idx_exercise_attempt_user_exercise on exercise_attempt (user_id, exercise_id, attempted_at desc);

-- =========================================================
-- 14. Weight Entry
-- =========================================================
create table weight_entry (
  weight_entry_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  measurement_date date not null,
  weight_kg numeric not null check (weight_kg > 0),
  source text not null check (source in ('manual', 'smart_scale', 'wearable', 'checkin')),
  notes_optional text,
  created_at timestamptz not null default now()
);
alter table weight_entry enable row level security;
create policy "owner_all_weight_entry" on weight_entry for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index idx_weight_entry_user_date on weight_entry (user_id, measurement_date desc);

-- =========================================================
-- 15. Wearable Connection (structure prepared, not integrated)
-- =========================================================
create table wearable_connection (
  wearable_connection_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in
    ('apple_health', 'google_health_connect', 'garmin', 'fitbit', 'samsung_health', 'polar', 'other')),
  connected boolean not null default false,
  permissions_status text,
  last_sync_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
  -- Deliberately no token/credential columns here. Real credentials belong
  -- in a secrets manager (e.g. Supabase Vault), never a plain table column,
  -- per PRD-005's own "no plain-text access tokens" rule.
);
alter table wearable_connection enable row level security;
create policy "owner_all_wearable_connection" on wearable_connection for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =========================================================
-- 16. Wearable Daily Summary (structure prepared, not integrated)
-- =========================================================
create table wearable_daily_summary (
  wearable_summary_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  summary_date date not null,
  steps_optional integer,
  resting_heart_rate_optional integer,
  average_heart_rate_optional integer,
  active_minutes_optional integer,
  sleep_duration_minutes_optional integer,
  sleep_score_optional integer,
  calories_optional integer,
  source_provider text not null,
  synced_at timestamptz not null default now(),
  unique (user_id, summary_date, source_provider)
);
alter table wearable_daily_summary enable row level security;
create policy "owner_all_wearable_daily_summary" on wearable_daily_summary for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =========================================================
-- 17. Daily Reflection
-- =========================================================
create table daily_reflection (
  reflection_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  reflection_date date not null,
  plan_completed_status text not null check (plan_completed_status in ('yes', 'partly', 'no', 'not_applicable')),
  feeling_after text,
  chose_self_today boolean not null,
  reason_not_completed_optional text,
  note_for_tomorrow_optional text,
  created_at timestamptz not null default now(),
  unique (user_id, reflection_date) -- one reflection per day (not explicit in PRD — reasonable default, flagged in chat)
);
alter table daily_reflection enable row level security;
create policy "owner_all_daily_reflection" on daily_reflection for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =========================================================
-- 18. Coach Memory
-- =========================================================
create table coach_memory (
  coach_memory_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  memory_type text not null check (memory_type in
    ('preference', 'schedule_pattern', 'energy_pattern', 'recovery_pattern',
     'motivation_pattern', 'exercise_response', 'constraint', 'personal_context')),
  statement text not null,
  supporting_evidence text,
  confidence_score numeric(3, 2) not null check (confidence_score between 0 and 1),
  status text not null default 'suggested' check (status in ('suggested', 'confirmed', 'rejected', 'expired')),
  first_observed_at timestamptz not null default now(),
  last_confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table coach_memory enable row level security;
create policy "owner_all_coach_memory" on coach_memory for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index idx_coach_memory_user_status on coach_memory (user_id, status);

-- =========================================================
-- 19. Notification Preference (structure prepared, not integrated — PRD-006)
-- =========================================================
create table notification_preference (
  notification_preference_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  notifications_enabled boolean not null default true,
  morning_checkin_enabled boolean not null default true,
  workout_reminders_enabled boolean not null default true,
  resume_reminders_enabled boolean not null default true,
  evening_reflection_enabled boolean not null default true,
  quiet_hours_start time,
  quiet_hours_end time,
  preferred_channels text[] not null default '{"push","in_app"}',
  maximum_reminders_per_day integer not null default 3 check (maximum_reminders_per_day >= 0),
  updated_at timestamptz not null default now(),
  unique (user_id)
);
alter table notification_preference enable row level security;
create policy "owner_all_notification_preference" on notification_preference for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =========================================================
-- 20. Notification Event (structure prepared, not integrated — PRD-006)
-- =========================================================
create table notification_event (
  notification_event_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  notification_type text not null,
  scheduled_at timestamptz not null,
  sent_at_optional timestamptz,
  opened_at_optional timestamptz,
  acted_on_at_optional timestamptz,
  result text not null default 'pending' check (result in
    ('pending', 'delivered', 'opened', 'completed_action', 'snoozed', 'dismissed', 'failed')),
  related_workout_plan_id_optional uuid references workout_plan(workout_plan_id) on delete set null,
  created_at timestamptz not null default now()
);
alter table notification_event enable row level security;
create policy "owner_all_notification_event" on notification_event for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =========================================================
-- 21. Life Timeline Event (structure prepared, not integrated)
-- =========================================================
create table life_timeline_event (
  timeline_event_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_date date not null,
  event_type text not null check (event_type in
    ('started_crea', 'goal_created', 'first_workout', 'mastery_achieved', 'personal_best',
     'weight_milestone', 'consistency_milestone', 'recovery_milestone', 'event_completed', 'custom')),
  title text not null,
  description text,
  related_goal_id_optional uuid references goal(goal_id) on delete set null,
  related_workout_session_id_optional uuid references workout_session(workout_session_id) on delete set null,
  created_automatically boolean not null default false,
  visible_to_user boolean not null default true,
  created_at timestamptz not null default now()
);
alter table life_timeline_event enable row level security;
create policy "owner_all_life_timeline_event" on life_timeline_event for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index idx_life_timeline_event_user_date on life_timeline_event (user_id, event_date desc);
