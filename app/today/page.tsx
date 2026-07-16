"use client";

import { useState, useEffect, useCallback } from "react";
import { requestDailyPlan } from "@/lib/planner/requestDailyPlan";
import { saveReschedule, saveReflection, saveDailyPlan } from "@/lib/storage/plannerRepository";
import {
  getMemoriesPendingConfirmation,
  confirmMemory,
  rejectMemory,
  rejectAndSuppressMemory,
} from "@/lib/planner-algorithm/coachMemoryStore";
import { PlanCard } from "@/components/planner/PlanCard";
import { RescheduleFlow } from "@/components/planner/RescheduleFlow";
import { ReflectionForm } from "@/components/planner/ReflectionForm";
import { MemoryConfirmationPrompt } from "@/components/memory/MemoryConfirmationPrompt";
import { BottomNav } from "@/components/nav/BottomNav";
import type { DailyPlan, RescheduleReason, ReflectionCompletion, LocalCoachMemory } from "@/types/planner";

type View = "loading" | "plan" | "reschedule" | "reflection" | "reschedule-done" | "reflection-done" | "error";

export default function TodayPage() {
  const [view, setView] = useState<View>("loading");
  const [plan, setPlan] = useState<DailyPlan | null>(null);
  const [pendingMemory, setPendingMemory] = useState<LocalCoachMemory | null>(null);

  const loadPlan = useCallback(async () => {
    setView("loading");
    try {
      const result = await requestDailyPlan();
      setPlan(result);
      setView("plan");
      await saveDailyPlan(result);
      // "Crea occasionally asks" — check once per plan load, show at most one.
      const pending = await getMemoriesPendingConfirmation();
      setPendingMemory(pending[0] ?? null);
    } catch (err) {
      console.error("Failed to load daily plan", err);
      setView("error");
    }
  }, []);

  useEffect(() => {
    void loadPlan();
  }, [loadPlan]);

  async function handleReschedule(reason: RescheduleReason, proposedMoment: string) {
    await saveReschedule({ date: new Date().toISOString().slice(0, 10), reason, proposed_new_moment: proposedMoment });
    setView("reschedule-done");
  }

  async function handleReflection(data: {
    completed_plan: ReflectionCompletion;
    feeling_now: string;
    note_for_tomorrow: string;
  }) {
    await saveReflection({ date: new Date().toISOString().slice(0, 10), ...data });
    setView("reflection-done");
  }

  return (
    <div className="max-w-[480px] mx-auto h-screen flex flex-col overflow-hidden bg-blush">
      {view === "loading" && (
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="h-11 w-11 rounded-full border-[3px] border-line border-t-clay animate-spin mb-4.5" />
          <div className="font-display text-base text-[#7A6F63]">Crea denkt na over vandaag...</div>
        </div>
      )}

      {view === "error" && (
        <div className="flex-1 flex flex-col items-center justify-center px-7 text-center">
          <div className="text-[15px] text-[#7A6F63] mb-4">
            Er ging iets mis bij het ophalen van je plan. Dit zegt niets over hoe je dag gaat.
          </div>
          <button onClick={() => void loadPlan()} className="text-clay font-semibold text-sm">
            Probeer opnieuw
          </button>
        </div>
      )}

      {view === "plan" && plan && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {pendingMemory && (
            <div className="px-6 pt-6 flex-shrink-0">
              <MemoryConfirmationPrompt
                memory={pendingMemory}
                onConfirm={() => confirmMemory(pendingMemory.id).then(() => setPendingMemory(null))}
                onReject={() => rejectMemory(pendingMemory.id).then(() => setPendingMemory(null))}
                onNeverAskAgain={() => rejectAndSuppressMemory(pendingMemory.id).then(() => setPendingMemory(null))}
              />
            </div>
          )}
          <PlanCard plan={plan} onCantDoThis={() => setView("reschedule")} onReflect={() => setView("reflection")} />
        </div>
      )}

      {view === "reschedule" && (
        <RescheduleFlow onConfirm={handleReschedule} onCancel={() => setView("plan")} />
      )}

      {view === "reschedule-done" && (
        <div className="flex-1 flex flex-col items-center justify-center px-7 text-center">
          <div className="text-[32px] mb-3">✅</div>
          <div className="font-display text-lg mb-2">Aangepast</div>
          <div className="text-sm text-[#7A6F63] mb-6">Dit staat niet als gemist geregistreerd.</div>
          <button onClick={() => setView("plan")} className="text-clay font-semibold text-sm">
            Terug naar plan
          </button>
        </div>
      )}

      {view === "reflection" && (
        <ReflectionForm onSubmit={handleReflection} onCancel={() => setView("plan")} />
      )}

      {view === "reflection-done" && (
        <div className="flex-1 flex flex-col items-center justify-center px-7 text-center">
          <div className="text-[32px] mb-3">❤️</div>
          <div className="font-display text-lg mb-2">Bedankt</div>
          <div className="text-sm text-[#7A6F63]">Dit helpt Crea om morgen nog beter aan te sluiten.</div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
