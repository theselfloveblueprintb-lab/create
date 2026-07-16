"use client";

import { useState, useEffect, useCallback } from "react";
import {
  listMemories,
  editMemoryStatement,
  deleteMemory,
  setMemoryDisabled,
  expireMemory,
  isLearningEnabled,
  setLearningEnabled,
  exportMemoriesAsJson,
} from "@/lib/planner-algorithm/coachMemoryStore";
import { MemoryCard } from "@/components/memory/MemoryCard";
import type { LocalCoachMemory } from "@/types/planner";

// The Memory Dashboard PRD-007 explicitly asks for: view every memory,
// edit/delete/disable each one, plus the two Privacy-section controls
// (export, disable learning entirely).
export default function MemoriesPage() {
  const [memories, setMemories] = useState<LocalCoachMemory[]>([]);
  const [learningEnabled, setLearningEnabledState] = useState(true);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [all, enabled] = await Promise.all([listMemories(), isLearningEnabled()]);
    setMemories(all.filter((m) => m.status !== "rejected")); // rejected memories are noise, not useful to review
    setLearningEnabledState(enabled);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleExport() {
    const json = await exportMemoriesAsJson();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `crea-coach-memory-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function toggleLearning() {
    const next = !learningEnabled;
    await setLearningEnabled(next);
    setLearningEnabledState(next);
  }

  const confirmed = memories.filter((m) => m.status === "confirmed");
  const suggested = memories.filter((m) => m.status === "suggested");

  return (
    <div className="max-w-[480px] mx-auto min-h-screen bg-blush px-6 py-6 font-body">
      <h1 className="font-display font-bold text-[24px] mb-1">Wat Crea over je heeft geleerd</h1>
      <p className="text-sm text-[#7A6F63] mb-6">
        Je kunt elk patroon bewerken, uitschakelen of verwijderen.
      </p>

      <div className="rounded-card border-[1.5px] border-line bg-white p-4 mb-6 flex items-center justify-between">
        <div>
          <div className="text-[14px] font-medium">Leren inschakelen</div>
          <div className="text-[12px] text-[#7A6F63]">Crea herkent geen nieuwe patronen als dit uitstaat.</div>
        </div>
        <div
          onClick={toggleLearning}
          className={`w-[52px] h-[28px] rounded-full relative cursor-pointer transition-colors ${
            learningEnabled ? "bg-sage" : "bg-[#D8D1BE]"
          }`}
        >
          <div
            className={`absolute top-[3px] w-[22px] h-[22px] rounded-full bg-white shadow transition-all ${
              learningEnabled ? "left-[27px]" : "left-[3px]"
            }`}
          />
        </div>
      </div>

      {loading && <div className="text-sm text-[#7A6F63]">Laden...</div>}

      {!loading && memories.length === 0 && (
        <div className="text-sm text-[#7A6F63] mb-6">
          Crea heeft nog geen patronen herkend — dat komt vanzelf naarmate je Crea vaker gebruikt.
        </div>
      )}

      {confirmed.length > 0 && (
        <>
          <div className="text-[12px] uppercase tracking-wide text-[#9A8E80] font-semibold mb-2">Bevestigd</div>
          {confirmed.map((m) => (
            <MemoryCard
              key={m.id}
              memory={m}
              onEdit={(text) => editMemoryStatement(m.id, text).then(load)}
              onDelete={() => deleteMemory(m.id).then(load)}
              onToggleDisabled={(disabled) => setMemoryDisabled(m.id, disabled).then(load)}
              onExpire={() => expireMemory(m.id).then(load)}
            />
          ))}
        </>
      )}

      {suggested.length > 0 && (
        <>
          <div className="text-[12px] uppercase tracking-wide text-[#9A8E80] font-semibold mb-2 mt-4">
            Nog niet bevestigd
          </div>
          {suggested.map((m) => (
            <MemoryCard
              key={m.id}
              memory={m}
              onEdit={(text) => editMemoryStatement(m.id, text).then(load)}
              onDelete={() => deleteMemory(m.id).then(load)}
              onToggleDisabled={(disabled) => setMemoryDisabled(m.id, disabled).then(load)}
              onExpire={() => expireMemory(m.id).then(load)}
            />
          ))}
        </>
      )}

      {memories.length > 0 && (
        <button onClick={handleExport} className="text-sm text-clay font-semibold mt-4">
          Exporteer al mijn patronen
        </button>
      )}
    </div>
  );
}
