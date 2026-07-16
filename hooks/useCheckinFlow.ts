"use client";

import { useState, useCallback } from "react";
import { STEP_ORDER, EMPTY_ENTRY, type CheckinEntry, type DailyPlan, type StepId } from "@/types/checkin";
import { generatePlan, FALLBACK_PLAN } from "@/lib/ai/generatePlan";
import { saveCheckin } from "@/lib/storage/checkinRepository";

// Central state machine for the check-in flow. Step components stay
// dumb (props in, callbacks out) — all navigation and persistence
// logic lives here so it's testable independent of any UI.
export function useCheckinFlow() {
  const [stepIndex, setStepIndex] = useState(0);
  const [history, setHistory] = useState<number[]>([]);
  const [entry, setEntry] = useState<Omit<CheckinEntry, "date">>(EMPTY_ENTRY);
  const [plan, setPlan] = useState<DailyPlan | null>(null);

  const step: StepId = STEP_ORDER[stepIndex];

  const updateEntry = useCallback((patch: Partial<CheckinEntry>) => {
    setEntry((prev) => ({ ...prev, ...patch }));
  }, []);

  const goBack = useCallback(() => {
    setHistory((prev) => {
      if (prev.length === 0) return prev;
      const copy = [...prev];
      const last = copy.pop() as number;
      setStepIndex(last);
      return copy;
    });
  }, []);

  const runPlanGeneration = useCallback(async () => {
    // foot_status comes directly from what the user picked in PainStep —
    // no separate stored toggle, no silent worst-case default.
    const fullEntry: CheckinEntry = {
      ...entry,
      date: new Date().toISOString().slice(0, 10),
    };
    try {
      const result = await generatePlan(fullEntry);
      setPlan(result);
    } catch (err) {
      console.error("Crea: plan generation failed, using fallback", err);
      setPlan(FALLBACK_PLAN);
    } finally {
      await saveCheckin(fullEntry);
    }
  }, [entry]);

  const goNext = useCallback(() => {
    setHistory((prev) => [...prev, stepIndex]);
    const nextIndex = stepIndex + 1;
    setStepIndex(nextIndex);
    if (STEP_ORDER[nextIndex] === "loading") {
      void runPlanGeneration().then(() => setStepIndex(nextIndex + 1));
    }
  }, [stepIndex, runPlanGeneration]);

  return {
    step,
    stepIndex,
    canGoBack: history.length > 0 && step !== "loading" && step !== "result",
    entry,
    plan,
    updateEntry,
    goNext,
    goBack,
  };
}
