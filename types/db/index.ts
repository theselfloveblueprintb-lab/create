// TypeScript types mirroring supabase/migrations/0001_init_schema.sql
// EXACTLY — field names, nullability, and value unions match the SQL
// definitions 1:1. If you change a column, change it here too; nothing
// auto-generates these yet (Supabase CLI can do this later via
// `supabase gen types typescript`, once a live project exists).
//
// These are DB-shape types (snake_case, matching Postgres columns) —
// distinct from the app-level camelCase types in types/checkin.ts,
// types/profile.ts, etc. Repositories in lib/db/repositories/ are the
// translation boundary between the two.

export type MedicalClearanceStatus = "unknown" | "not_cleared" | "partially_cleared" | "cleared";
export type CoachStyleDb = "gentle" | "direct" | "strict";
export type EquipmentType =
  | "yoga_mat" | "dumbbells" | "resistance_bands" | "treadmill" | "exercise_bike"
  | "rowing_machine" | "gym_membership" | "swimming_pool" | "none" | "other";
export type GoalType = "event" | "fitness" | "weight" | "strength" | "recovery" | "energy" | "habit" | "other";
export type GoalStatus = "active" | "paused" | "completed" | "cancelled";
export type GoalPriority = "primary" | "secondary";
export type ExerciseCategory =
  | "cardio" | "strength" | "mobility" | "recovery" | "balance"
  | "ankle_stability" | "core" | "grip" | "obstacle_skill" | "mindfulness";
export type DifficultyLevel = "beginner" | "intermediate" | "advanced";
export type ImpactLevel = "none" | "low" | "moderate" | "high";
export type WorkoutPlanStatus =
  | "proposed" | "accepted" | "rescheduled" | "started" | "completed"
  | "partially_completed" | "cancelled" | "replaced";
export type WorkoutIntensity = "recovery" | "light" | "moderate" | "challenging";
export type WorkoutPlanItemType = "warm_up" | "exercise" | "rest" | "cool_down" | "breathing" | "reflection";
export type SessionStatus = "started" | "paused" | "completed" | "partially_completed" | "stopped_for_safety" | "abandoned";
export type FormQuality = "unknown" | "poor" | "acceptable" | "good";
export type WeightSource = "manual" | "smart_scale" | "wearable" | "checkin";
export type PlanCompletedStatus = "yes" | "partly" | "no" | "not_applicable";
export type CoachMemoryType =
  // Updated in PRD-007 from an 8-type taxonomy to this authoritative
  // 6-type list — see supabase/migrations/0002_update_coach_memory_types.sql
  | "schedule_pattern" | "energy_pattern" | "exercise_preference"
  | "recovery_pattern" | "motivation_pattern" | "lifestyle_pattern";
export type CoachMemoryStatus = "suggested" | "confirmed" | "rejected" | "expired";
export type CalendarProviderDb = "google" | "apple" | "outlook" | "manual";
export type AvailabilitySource = "calendar" | "manual" | "learned_pattern";
export type AvailabilityType = "free" | "flexible" | "busy" | "travel" | "work" | "family" | "sleep";
export type WearableProviderDb =
  | "apple_health" | "google_health_connect" | "garmin" | "fitbit" | "samsung_health" | "polar" | "other";
export type TimelineEventType =
  | "started_crea" | "goal_created" | "first_workout" | "mastery_achieved" | "personal_best"
  | "weight_milestone" | "consistency_milestone" | "recovery_milestone" | "event_completed" | "custom";
export type NotificationResult = "pending" | "delivered" | "opened" | "completed_action" | "snoozed" | "dismissed" | "failed";

// ---- 1. User Profile ----
export interface DbUserProfile {
  user_id: string;
  first_name: string;
  date_of_birth: string;
  height_cm: number;
  current_weight_kg: number;
  target_weight_kg: number | null;
  gender_optional: string | null;
  timezone: string;
  coach_style: CoachStyleDb;
  primary_goal: string;
  motivation_statement: string | null;
  default_available_time_minutes: number;
  created_at: string;
  updated_at: string;
}

// ---- 2. Health Profile ----
export interface DbHealthProfile {
  health_profile_id: string;
  user_id: string;
  injuries: string[];
  physical_limitations: string[];
  recovery_status: string | null;
  medical_clearance_status: MedicalClearanceStatus;
  medical_notes_optional: string | null;
  pain_thresholds: Record<string, number> | null;
  created_at: string;
  updated_at: string;
}

// ---- 3. Equipment Profile ----
export interface DbEquipmentProfile {
  equipment_profile_id: string;
  user_id: string;
  equipment_type: EquipmentType;
  quantity_optional: number | null;
  weight_or_resistance_optional: string | null;
  available: boolean;
  notes_optional: string | null;
}

// ---- 4. Daily Check-in ----
export interface DbDailyCheckin {
  checkin_id: string;
  user_id: string;
  checkin_date: string;
  energy_level: number; // 1-5
  sleep_score: number; // 1-5
  stress_level: number; // 0-10
  foot_pain_score: number; // 0-10
  general_pain_score_optional: number | null;
  body_status: string | null;
  motivation_level_optional: number | null;
  resting_heart_rate_optional: number | null;
  weight_kg_optional: number | null;
  user_note_optional: string | null;
  created_at: string;
}

// ---- 7. Goal ----
export interface DbGoal {
  goal_id: string;
  user_id: string;
  goal_type: GoalType;
  goal_title: string;
  goal_description: string | null;
  start_date: string;
  target_date_optional: string | null;
  target_value_optional: number | null;
  current_value_optional: number | null;
  priority: GoalPriority;
  status: GoalStatus;
  created_at: string;
  updated_at: string;
}

// ---- 8. Exercise Library ----
export interface DbExercise {
  exercise_id: string;
  name: string;
  category: ExerciseCategory;
  description: string;
  instructions: string | null;
  animation_or_media_url_optional: string | null;
  equipment_required: string[];
  difficulty_level: DifficultyLevel;
  target_muscles: string[];
  target_skills: string[];
  impact_level: ImpactLevel;
  weight_bearing: boolean;
  estimated_duration_seconds: number;
  default_repetitions_optional: number | null;
  default_sets_optional: number | null;
  default_hold_seconds_optional: number | null;
  safety_instructions: string;
  contraindications: string[];
  alternative_exercise_ids: string[];
  active: boolean;
  created_at: string;
  updated_at: string;
}

// ---- 9. Exercise Progress ----
export interface DbExerciseProgress {
  exercise_progress_id: string;
  user_id: string;
  exercise_id: string;
  current_level: number;
  current_target: number;
  personal_best: number;
  successful_attempts: number;
  recent_attempts_count: number;
  mastery_required_successes: number;
  mastered: boolean;
  mastered_at_optional: string | null;
  next_target_optional: number | null;
  last_attempt_at: string | null;
  created_at: string;
  updated_at: string;
}

// ---- 10. Exercise Attempt ----
export interface DbExerciseAttempt {
  attempt_id: string;
  user_id: string;
  workout_session_id: string;
  exercise_id: string;
  attempted_at: string;
  target_repetitions_optional: number | null;
  completed_repetitions_optional: number | null;
  target_seconds_optional: number | null;
  completed_seconds_optional: number | null;
  target_distance_optional: number | null;
  completed_distance_optional: number | null;
  weight_used_optional: number | null;
  form_quality_optional: FormQuality | null;
  pain_during_score_optional: number | null;
  difficulty_rating_optional: number | null;
  completed: boolean;
  skipped: boolean;
  skip_reason_optional: string | null;
  notes_optional: string | null;
}

// ---- 11. Workout Plan ----
export interface DbWorkoutPlan {
  workout_plan_id: string;
  user_id: string;
  plan_date: string;
  scheduled_start_time_optional: string | null;
  planned_duration_minutes: number;
  primary_goal: string;
  intensity: WorkoutIntensity;
  reason_for_recommendation: string;
  status: WorkoutPlanStatus;
  source_checkin_id: string | null;
  source_goal_id_optional: string | null;
  created_at: string;
  updated_at: string;
}

// ---- 12. Workout Plan Item ----
export interface DbWorkoutPlanItem {
  workout_plan_item_id: string;
  workout_plan_id: string;
  exercise_id_optional: string | null;
  item_type: WorkoutPlanItemType;
  sequence_number: number;
  planned_sets_optional: number | null;
  planned_repetitions_optional: number | null;
  planned_seconds_optional: number | null;
  planned_distance_optional: number | null;
  rest_seconds_optional: number | null;
  instructions_optional: string | null;
}

// ---- 13. Workout Session ----
export interface DbWorkoutSession {
  workout_session_id: string;
  user_id: string;
  workout_plan_id_optional: string | null;
  started_at: string;
  ended_at_optional: string | null;
  actual_duration_minutes: number | null;
  completion_percentage: number | null;
  energy_before_optional: number | null;
  energy_after_optional: number | null;
  pain_before_optional: number | null;
  pain_after_optional: number | null;
  session_status: SessionStatus;
  user_notes_optional: string | null;
  created_at: string;
  updated_at: string;
}

// ---- 14. Weight Entry ----
export interface DbWeightEntry {
  weight_entry_id: string;
  user_id: string;
  measurement_date: string;
  weight_kg: number;
  source: WeightSource;
  notes_optional: string | null;
  created_at: string;
}

// ---- 17. Daily Reflection ----
export interface DbDailyReflection {
  reflection_id: string;
  user_id: string;
  reflection_date: string;
  plan_completed_status: PlanCompletedStatus;
  feeling_after: string | null;
  chose_self_today: boolean;
  reason_not_completed_optional: string | null;
  note_for_tomorrow_optional: string | null;
  created_at: string;
}

// ---- 18. Coach Memory ----
export interface DbCoachMemory {
  coach_memory_id: string;
  user_id: string;
  memory_type: CoachMemoryType;
  statement: string;
  supporting_evidence: string | null;
  confidence_score: number;
  observation_count: number; // added PRD-007 — see migration 0002
  status: CoachMemoryStatus;
  user_disabled: boolean; // added PRD-007 — see migration 0002
  first_observed_at: string;
  last_confirmed_at: string | null;
  created_at: string;
  updated_at: string;
}

// ---- 5, 6, 15, 16, 19, 20, 21: "prepare structure" tables ----
// Types included for completeness; no repositories built for these yet
// (PRD-005 explicitly defers integration to PRD-006/007).

export interface DbCalendarConnection {
  calendar_connection_id: string;
  user_id: string;
  provider: CalendarProviderDb;
  connected: boolean;
  external_account_id: string | null;
  permissions_status: string | null;
  last_sync_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbAvailabilityBlock {
  availability_block_id: string;
  user_id: string;
  date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  source: AvailabilitySource;
  availability_type: AvailabilityType;
  confidence_score: number | null;
  reserved_for_crea: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbWearableConnection {
  wearable_connection_id: string;
  user_id: string;
  provider: WearableProviderDb;
  connected: boolean;
  permissions_status: string | null;
  last_sync_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbWearableDailySummary {
  wearable_summary_id: string;
  user_id: string;
  summary_date: string;
  steps_optional: number | null;
  resting_heart_rate_optional: number | null;
  average_heart_rate_optional: number | null;
  active_minutes_optional: number | null;
  sleep_duration_minutes_optional: number | null;
  sleep_score_optional: number | null;
  calories_optional: number | null;
  source_provider: string;
  synced_at: string;
}

export interface DbNotificationPreference {
  notification_preference_id: string;
  user_id: string;
  notifications_enabled: boolean;
  morning_checkin_enabled: boolean;
  workout_reminders_enabled: boolean;
  resume_reminders_enabled: boolean;
  evening_reflection_enabled: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  preferred_channels: string[];
  maximum_reminders_per_day: number;
  updated_at: string;
}

export interface DbNotificationEvent {
  notification_event_id: string;
  user_id: string;
  notification_type: string;
  scheduled_at: string;
  sent_at_optional: string | null;
  opened_at_optional: string | null;
  acted_on_at_optional: string | null;
  result: NotificationResult;
  related_workout_plan_id_optional: string | null;
  created_at: string;
}

export interface DbLifeTimelineEvent {
  timeline_event_id: string;
  user_id: string;
  event_date: string;
  event_type: TimelineEventType;
  title: string;
  description: string | null;
  related_goal_id_optional: string | null;
  related_workout_session_id_optional: string | null;
  created_automatically: boolean;
  visible_to_user: boolean;
  created_at: string;
}
