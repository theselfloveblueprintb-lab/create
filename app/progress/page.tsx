"use client";

import { useState, useEffect } from "react";
import { getWeightHistory } from "@/lib/storage/checkinRepository";
import { getAllMasteryRecords, getRecentCompletions } from "@/lib/storage/workoutRepository";
import { EXERCISE_LIBRARY } from "@/lib/workout/exerciseLibrary";
import { BottomNav } from "@/components/nav/BottomNav";
import type { ExerciseMasteryRecord, WorkoutCompletionLog } from "@/types/workout";

export default function ProgressPage() {
  const [weights, setWeights] = useState<{ date: string; weight: number }[]>([]);
  const [mastery, setMastery] = useState<Record<string, ExerciseMasteryRecord>>({});
  const [completions, setCompletions] = useState<WorkoutCompletionLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const [w, m, c] = await Promise.all([getWeightHistory(), getAllMasteryRecords(), getRecentCompletions(10)]);
      setWeights(w);
      setMastery(m);
      setCompletions(c.reverse());
      setLoading(false);
    })();
  }, []);

  const inProgress = Object.values(mastery).filter((m) => m.attempts.length > 0 && !m.mastered);
  const masteredList = Object.values(mastery).filter((m) => m.mastered);

  return (
    <div className="max-w-[480px] mx-auto h-screen flex flex-col overflow-hidden bg-blush">
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <h1 className="font-display font-bold text-[24px] mb-6">Jouw voortgang</h1>

        {loading && <div className="text-sm text-[#7A6F63]">Laden...</div>}

        {!loading && (
          <>
            <div className="mb-6">
              <div className="text-[12px] uppercase tracking-wide text-[#9A8E80] font-semibold mb-2">Gewicht</div>
              {weights.length === 0 ? (
                <div className="text-sm text-[#7A6F63]">
                  Nog geen gewicht gelogd — dit vul je optioneel in tijdens de ochtend check-in.
                </div>
              ) : (
                <div className="rounded-card border-[1.5px] border-line bg-white p-4">
                  <div className="font-display text-2xl font-bold mb-1">
                    {weights[weights.length - 1].weight} kg
                  </div>
                  <div className="text-xs text-[#9A8E80]">
                    Laatste meting: {weights[weights.length - 1].date} · {weights.length} metingen totaal
                  </div>
                </div>
              )}
            </div>

            <div className="mb-6">
              <div className="text-[12px] uppercase tracking-wide text-[#9A8E80] font-semibold mb-2">
                Recente trainingen
              </div>
              {completions.length === 0 ? (
                <div className="text-sm text-[#7A6F63]">Nog geen trainingen afgerond.</div>
              ) : (
                <div className="space-y-2">
                  {completions.map((c, i) => (
                    <div key={i} className="rounded-card border-[1.5px] border-line bg-white p-3 flex justify-between items-center">
                      <span className="text-sm">{c.date}</span>
                      <span className="text-sm font-semibold text-clay">{c.completion_pct}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mb-6">
              <div className="text-[12px] uppercase tracking-wide text-[#9A8E80] font-semibold mb-2">
                Gemasterde oefeningen ({masteredList.length})
              </div>
              {masteredList.length === 0 ? (
                <div className="text-sm text-[#7A6F63]">Nog geen oefening gemasterd — dat komt vanzelf.</div>
              ) : (
                <div className="space-y-2">
                  {masteredList.map((m) => {
                    const exercise = EXERCISE_LIBRARY.find((e) => e.id === m.exercise_id);
                    return (
                      <div key={m.exercise_id} className="rounded-card border-[1.5px] border-sage bg-[#F0F4F0] p-3">
                        <div className="text-sm font-medium">{exercise?.name ?? m.exercise_id}</div>
                        <div className="text-xs text-[#3F5745]">Doel: {m.current_target} · Volgende niveau: {m.next_target}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <div className="text-[12px] uppercase tracking-wide text-[#9A8E80] font-semibold mb-2">
                Bezig met opbouwen ({inProgress.length})
              </div>
              {inProgress.length === 0 ? (
                <div className="text-sm text-[#7A6F63]">Niets in opbouw op dit moment.</div>
              ) : (
                <div className="space-y-2">
                  {inProgress.map((m) => {
                    const exercise = EXERCISE_LIBRARY.find((e) => e.id === m.exercise_id);
                    return (
                      <div key={m.exercise_id} className="rounded-card border-[1.5px] border-line bg-white p-3">
                        <div className="text-sm font-medium">{exercise?.name ?? m.exercise_id}</div>
                        <div className="text-xs text-[#9A8E80]">
                          Doel: {m.current_target} · Beste poging: {m.current_best} · {m.attempts.length} pogingen
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
