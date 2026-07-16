"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getTodaysPlan } from "@/lib/storage/plannerRepository";
import { requestTodaysWorkout } from "@/lib/workout/requestWorkout";
import {
  getMasteryRecord,
  saveMasteryRecord,
  saveCompletion,
  saveGeneratedWorkout,
} from "@/lib/storage/workoutRepository";
import { recordAttempt } from "@/lib/workout/masteryEngine";
import { BottomNav } from "@/components/nav/BottomNav";
import { Button } from "@/components/ui/Button";
import type { GeneratedWorkout, PrescribedExercise } from "@/types/workout";

type SessionStatus = "idle" | "loading" | "running" | "paused" | "finished" | "error";

interface ExerciseResult {
  exercise_id: string;
  completed: number; // reps or seconds actually done
  skipped: boolean;
}

function flattenExercises(workout: GeneratedWorkout): PrescribedExercise[] {
  return [...workout.warmup, ...workout.main, ...workout.cooldown];
}

export default function TrainingPage() {
  const [status, setStatus] = useState<SessionStatus>("idle");
  const [workout, setWorkout] = useState<GeneratedWorkout | null>(null);
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [results, setResults] = useState<ExerciseResult[]>([]);
  const [inputValue, setInputValue] = useState<string>("");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const startedAtRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const exercises = workout ? flattenExercises(workout) : [];
  const current = exercises[exerciseIndex];

  async function loadWorkout() {
    setStatus("loading");
    try {
      // Reuse today's already-generated plan if /today ran first — avoids
      // a second AI call for the same day. Falls back to a fresh request
      // if the user opens Training directly.
      const todaysPlan = await getTodaysPlan();
      const source = todaysPlan?.primary_workout ?? (await requestTodaysWorkout());
      setWorkout(source);
      setInputValue(String(source.warmup[0]?.prescribed_target ?? source.main[0]?.prescribed_target ?? ""));
    } catch (err) {
      console.error("Failed to load workout", err);
      setStatus("error");
      return;
    }
    setStatus("idle");
  }

  useEffect(() => {
    void loadWorkout();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function startSession() {
    setStatus("running");
    startedAtRef.current = Date.now();
    timerRef.current = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    if (current) setInputValue(String(current.prescribed_target));
  }

  function pauseSession() {
    setStatus("paused");
    if (timerRef.current) clearInterval(timerRef.current);
  }

  function resumeSession() {
    setStatus("running");
    timerRef.current = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
  }

  const finishSession = useCallback(
    async (finalResults: ExerciseResult[]) => {
      if (timerRef.current) clearInterval(timerRef.current);
      setStatus("finished");
      if (!workout) return;

      const completedCount = finalResults.filter((r) => !r.skipped).length;
      const completionPct = exercises.length > 0 ? Math.round((completedCount / exercises.length) * 100) : 0;

      try {
        await saveCompletion({
          date: workout.date,
          duration_min: Math.round(elapsedSeconds / 60),
          completion_pct: completionPct,
          exercises_completed: finalResults.filter((r) => !r.skipped).map((r) => ({
            exercise_id: r.exercise_id,
            reps_or_seconds_completed: r.completed,
          })),
          exercises_skipped: finalResults.filter((r) => r.skipped).map((r) => r.exercise_id),
          pain_score: 0,
          energy_before: null,
          energy_after: null,
          notes: "",
        });
        await saveGeneratedWorkout(workout);
      } catch (err) {
        console.error("Saving workout completion failed", err);
      }
    },
    [workout, elapsedSeconds, exercises]
  );

  const recordAndAdvance = useCallback(
    async (skipped: boolean) => {
      if (!current) return;
      const completedValue = skipped ? 0 : parseInt(inputValue, 10) || 0;
      setResults((prev) => [...prev, { exercise_id: current.exercise_id, completed: completedValue, skipped }]);

      if (!skipped) {
        try {
          const record = await getMasteryRecord(current.exercise_id);
          const updated = recordAttempt(record, completedValue);
          await saveMasteryRecord(updated);
        } catch (err) {
          console.error("Mastery update failed (non-blocking)", err);
        }
      }

      const nextIndex = exerciseIndex + 1;
      if (nextIndex < exercises.length) {
        setExerciseIndex(nextIndex);
        setInputValue(String(exercises[nextIndex].prescribed_target));
      } else {
        await finishSession([...results, { exercise_id: current.exercise_id, completed: completedValue, skipped }]);
      }
    },
    [current, inputValue, exerciseIndex, exercises, results, finishSession]
  );

  return (
    <div className="max-w-[480px] mx-auto h-screen flex flex-col overflow-hidden bg-blush">
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {status === "loading" && (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="h-11 w-11 rounded-full border-[3px] border-line border-t-clay animate-spin mb-4.5" />
            <div className="text-sm text-[#7A6F63]">Workout laden...</div>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-sm text-[#7A6F63] mb-4">Kon de workout niet laden.</div>
            <button onClick={() => void loadWorkout()} className="text-clay font-semibold text-sm">
              Probeer opnieuw
            </button>
          </div>
        )}

        {status === "idle" && workout && (
          <div className="flex flex-col h-full justify-center">
            <h1 className="font-display font-bold text-[24px] mb-2">{workout.primary_goal}</h1>
            <p className="text-sm text-[#7A6F63] mb-6">
              {exercises.length} oefeningen · ~{workout.total_duration_min} min
            </p>
            <div className="space-y-2 mb-6">
              {exercises.map((e) => (
                <div key={e.exercise_id} className="text-sm text-[#7A6F63]">
                  · {e.name}
                </div>
              ))}
            </div>
            <Button onClick={startSession}>Start training</Button>
          </div>
        )}

        {(status === "running" || status === "paused") && current && (
          <div className="flex flex-col h-full justify-center">
            <div className="text-[11px] uppercase tracking-wide text-[#9A8E80] mb-2">
              Oefening {exerciseIndex + 1} van {exercises.length}
            </div>
            <h1 className="font-display font-bold text-[24px] mb-2">{current.name}</h1>
            <div className="text-sm text-[#7A6F63] mb-1">
              Doel: {current.prescribed_sets} × {current.prescribed_target}
              {current.prescription_type === "duration" ? " seconden" : " reps"}
            </div>
            <div className="text-xs text-[#9A8E80] mb-6">{current.safety_instructions}</div>

            <label className="block mb-1 text-[13px] font-medium text-[#7A6F63]">
              Hoeveel heb je gehaald?
            </label>
            <input
              type="number"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full rounded-card border-[1.5px] border-line px-4 py-3 text-center font-display text-2xl font-bold mb-6"
            />

            <div className="text-xs text-[#9A8E80] text-center mb-6">Tijd bezig: {elapsedSeconds}s</div>

            <Button onClick={() => void recordAndAdvance(false)} className="mb-2.5">
              Voltooid — volgende
            </Button>
            <div className="flex gap-2">
              <div className="flex-1">
                <Button variant="secondary" onClick={() => void recordAndAdvance(true)}>
                  Overslaan
                </Button>
              </div>
              <div className="flex-1">
                {status === "running" ? (
                  <Button variant="secondary" onClick={pauseSession}>
                    Pauzeren
                  </Button>
                ) : (
                  <Button variant="secondary" onClick={resumeSession}>
                    Hervatten
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {status === "finished" && (
          <div className="flex flex-col h-full items-center justify-center text-center">
            <div className="text-[38px] mb-3">✅</div>
            <h1 className="font-display font-bold text-[22px] mb-2">Sessie afgerond</h1>
            <p className="text-sm text-[#7A6F63] mb-6">
              {results.filter((r) => !r.skipped).length} van {exercises.length} oefeningen voltooid.
              Elke keuze telt — ook overgeslagen oefeningen zijn geen falen.
            </p>
            <Button onClick={() => void loadWorkout().then(() => setStatus("idle"))}>Nieuwe sessie</Button>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
