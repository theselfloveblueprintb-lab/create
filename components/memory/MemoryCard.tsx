"use client";

import { useState } from "react";
import type { LocalCoachMemory } from "@/types/planner";

interface Props {
  memory: LocalCoachMemory;
  onEdit: (newStatement: string) => void;
  onDelete: () => void;
  onToggleDisabled: (disabled: boolean) => void;
  onExpire: () => void;
}

const STATUS_LABEL: Record<LocalCoachMemory["status"], string> = {
  confirmed: "✓ Bevestigd",
  suggested: "Voorgesteld",
  rejected: "Afgewezen",
  expired: "Verlopen",
};

const STATUS_COLOR: Record<LocalCoachMemory["status"], string> = {
  confirmed: "text-sage",
  suggested: "text-clay",
  rejected: "text-[#9A8E80]",
  expired: "text-[#9A8E80]",
};

export function MemoryCard({ memory, onEdit, onDelete, onToggleDisabled, onExpire }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(memory.statement);

  return (
    <div className={`rounded-card border-[1.5px] border-line bg-white p-4 mb-3 ${memory.user_disabled ? "opacity-50" : ""}`}>
      {editing ? (
        <div className="mb-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="w-full rounded-card border-[1.5px] border-line px-3 py-2 text-sm mb-2"
          />
          <div className="flex gap-2">
            <button
              onClick={() => {
                onEdit(draft);
                setEditing(false);
              }}
              className="text-xs font-semibold text-clay"
            >
              Opslaan
            </button>
            <button onClick={() => setEditing(false)} className="text-xs text-[#9A8E80]">
              Annuleren
            </button>
          </div>
        </div>
      ) : (
        <div className="text-[14px] font-medium mb-1.5">{memory.statement}</div>
      )}

      <div className="flex items-center gap-2 mb-2">
        <span className={`text-[11px] font-semibold ${STATUS_COLOR[memory.status]}`}>{STATUS_LABEL[memory.status]}</span>
        <span className="text-[11px] text-[#9A8E80]">· {Math.round(memory.confidence_score * 100)}% zeker</span>
        {memory.user_disabled && <span className="text-[11px] text-[#9A8E80]">· Uitgeschakeld</span>}
      </div>
      <div className="text-[11px] text-[#9A8E80] mb-3">{memory.supporting_evidence}</div>

      {!editing && (
        <div className="flex gap-3 text-xs">
          <button onClick={() => setEditing(true)} className="text-clay font-medium">
            Bewerken
          </button>
          <button onClick={() => onToggleDisabled(!memory.user_disabled)} className="text-[#9A8E80] font-medium">
            {memory.user_disabled ? "Inschakelen" : "Uitschakelen"}
          </button>
          {memory.status === "confirmed" && (
            <button onClick={onExpire} className="text-[#9A8E80] font-medium">
              Niet meer waar
            </button>
          )}
          <button onClick={onDelete} className="text-[#B4462E] font-medium">
            Verwijderen
          </button>
        </div>
      )}
    </div>
  );
}
