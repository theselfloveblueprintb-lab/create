"use client";

import { useState } from "react";
import { ChoiceCard } from "@/components/ui/ChoiceCard";
import { Button } from "@/components/ui/Button";
import { recalculateAfterChange } from "@/lib/calendar/dynamicReschedule";
import { listMemoriesForPlanning } from "@/lib/planner-algorithm/coachMemoryStore";
import { proposeNewMoment } from "@/lib/planner/proposeNewMoment";
import type { RescheduleReason } from "@/types/planner";

const REASONS: RescheduleReason[] = ["Werk", "Familie", "Gezondheid", "Onverwachte gebeurtenis", "Anders"];

interface Props {
  onConfirm: (reason: RescheduleReason, proposedMoment: string) => void;
  onCancel: () => void;
}

// "What changed?" (PRD-004/006) — upgraded in PRD-008 to attempt real
// window recalculation against today's remaining calendar blocks when
// Manual Mode calendar data exists, falling back to the older heuristic
// text (proposeNewMoment) when it doesn't. Never frames this as a
// failure — no red states, no "you missed" language, either way.
export function RescheduleFlow({ onConfirm, onCancel }: Props) {
  const [reason, setReason] = useState<RescheduleReason | null>(null);
  const [proposed, setProposed] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSelect(r: RescheduleReason) {
    setReason(r);
    setLoading(true);
    try {
      const memories = await listMemoriesForPlanning();
      const today = new Date().toISOString().slice(0, 10);
      const now = new Date();
      const nowTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
      const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);
      const inOneHourTime = `${inOneHour.getHours().toString().padStart(2, "0")}:${inOneHour.getMinutes().toString().padStart(2, "0")}`;

      const outcome = await recalculateAfterChange(today, nowTime, inOneHourTime, r, memories);
      setProposed(
        outcome.newWindow
          ? outcome.explanation
          : outcome.explanation // already has a sensible "no room today" message
      );
    } catch (err) {
      console.error("Calendar recalculation failed, using fallback text", err);
      setProposed(proposeNewMoment(r));
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="h-9 w-9 rounded-full border-[3px] border-line border-t-clay animate-spin mb-3" />
        <div className="text-sm text-[#7A6F63]">Even kijken wat er nog past vandaag...</div>
      </div>
    );
  }

  if (proposed && reason) {
    return (
      <div className="flex flex-col justify-center h-full px-7">
        <div className="text-[32px] text-center mb-3">💭</div>
        <h1 className="font-display font-bold text-[22px] text-center mb-3">Geen probleem</h1>
        <p className="text-center text-sm text-[#7A6F63] mb-6 leading-relaxed">{proposed}</p>
        <Button onClick={() => onConfirm(reason, proposed)}>Klinkt goed</Button>
        <Button variant="secondary" className="mt-2.5" onClick={onCancel}>
          Terug naar plan
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-center h-full px-7">
      <h1 className="font-display font-bold text-[22px] text-center mb-1">Wat is er veranderd?</h1>
      <p className="text-center text-sm text-[#7A6F63] mb-6">Dit telt niet als gemist — we passen het plan aan.</p>
      <div className="flex flex-col gap-2">
        {REASONS.map((r) => (
          <ChoiceCard key={r} label={r} selected={reason === r} onClick={() => handleSelect(r)} />
        ))}
      </div>
    </div>
  );
}
