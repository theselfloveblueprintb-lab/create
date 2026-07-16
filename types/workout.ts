// Domain types for PRD-003 — Workout Engine.
// Independent of types/checkin.ts and types/profile.ts — this module reads
// from both but doesn't own or extend either.

export type WorkoutCategory =
  | "cardio"
  | "strength"
  | "mobility"
  | "recovery"
  | "injury_prevention"
  | "harbor_run_skills";

export type Difficulty = "beginner" | "gemiddeld" | "gevorderd";

export type PrescriptionType = "reps" | "duration"; // reps-based (push-ups) vs duration-based (plank, walk)

export interface Exercise {
  id: string;
  name: string;
  category: WorkoutCategory;
  description: string;
  animation_ref: string; // slug for a future animation asset — no asset exists yet
  equipment_required: string[]; // matches EquipmentOption values from profile; [] = bodyweight/no equipment
  difficulty: Difficulty;
  prescription_type: PrescriptionType;
  base_target: number; // reps, or seconds if duration-based
  base_sets: number;
  estimated_duration_min: number; // per set/round, used for time-budget math
  target_muscle_groups: string[];
  target_skills: string[];
  safety_instructions: string;
  alternative_exercise_id: string | null;
  high_impact: boolean; // running/jumping/plyometric/obstacle-prep — excluded above the foot-pain threshold
}

// ---- Mastery ----

export interface ExerciseMasteryRecord {
  exercise_id: string;
  current_target: number; // current prescribed reps/seconds
  attempts: number[]; // history of completed reps/seconds, most recent last
  current_best: number;
  consistency_score: number; // 0-1, fraction of recent attempts meeting current_target
  mastered: boolean;
  next_target: number | null; // set once mastered
}

// ---- Generated workout ----

export type WorkoutGoal =
  | "Improve Cardio"
  | "Increase Strength"
  | "Improve Recovery"
  | "Build Mobility"
  | "Increase Harbor Run Readiness";

export interface PrescribedExercise {
  exercise_id: string;
  name: string;
  category: WorkoutCategory;
  prescribed_target: number;
  prescribed_sets: number;
  prescription_type: PrescriptionType;
  estimated_duration_min: number;
  safety_instructions: string;
  alternative_exercise_id: string | null;
}

export interface GeneratedWorkout {
  date: string;
  primary_goal: WorkoutGoal;
  warmup: PrescribedExercise[];
  main: PrescribedExercise[];
  cooldown: PrescribedExercise[];
  total_duration_min: number;
  coach_note: string; // short, tone-matched to coach_style — not a safety instruction
}

// ---- Completion logging ----

export interface WorkoutCompletionLog {
  date: string;
  duration_min: number;
  completion_pct: number;
  exercises_completed: { exercise_id: string; reps_or_seconds_completed: number }[];
  exercises_skipped: string[];
  pain_score: number;
  energy_before: number | null;
  energy_after: number | null;
  notes: string;
}

// Configurable safety threshold — PRD-003 left the number unspecified.
export const FOOT_PAIN_SAFETY_THRESHOLD = 4; // out of 10
