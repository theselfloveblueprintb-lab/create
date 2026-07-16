"use client";

import { Button } from "@/components/ui/Button";
import type { LocalCoachMemory } from "@/types/planner";

interface Props {
  memory: LocalCoachMemory;
  onConfirm: () => void;
  onReject: () => void;
  onNeverAskAgain: () => void;
}

// The exact "Crea occasionally asks" pattern from PRD-007, with all
// three specified buttons. Only shown for memories that have already
// earned enough evidence (see confidenceScoring.ts) — not every guess.
export function MemoryConfirmationPrompt({ memory, onConfirm, onReject, onNeverAskAgain }: Props) {
  return (
    <div className="rounded-card border-[1.5px] border-clay bg-[#FBF2ED] p-4 mb-4">
      <div className="text-[13px] text-[#7A4A34] leading-relaxed mb-3">
        Ik heb gemerkt: <span className="font-medium">{memory.statement}</span>
        <br />
        Klopt dat?
      </div>
      <div className="flex gap-2">
        <div className="flex-1">
          <Button onClick={onConfirm}>Ja</Button>
        </div>
        <div className="flex-1">
          <Button variant="secondary" onClick={onReject}>
            Niet echt
          </Button>
        </div>
      </div>
      <button onClick={onNeverAskAgain} className="text-xs text-[#9A8E80] mt-2 underline">
        Vraag dit niet meer
      </button>
    </div>
  );
}
