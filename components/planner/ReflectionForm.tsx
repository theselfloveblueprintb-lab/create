"use client";

import { useState } from "react";
import { ChoiceCard } from "@/components/ui/ChoiceCard";
import { TextArea } from "@/components/ui/TextArea";
import { Button } from "@/components/ui/Button";
import type { ReflectionCompletion } from "@/types/planner";

interface Props {
  onSubmit: (data: { completed_plan: ReflectionCompletion; feeling_now: string; note_for_tomorrow: string }) => void;
  onCancel: () => void;
}

// Exactly the three questions PRD-004 specifies — nothing more.
export function ReflectionForm({ onSubmit, onCancel }: Props) {
  const [completed, setCompleted] = useState<ReflectionCompletion | null>(null);
  const [feeling, setFeeling] = useState("");
  const [note, setNote] = useState("");

  return (
    <div className="flex flex-col h-full px-7 overflow-y-auto py-6">
      <h1 className="font-display font-bold text-[22px] text-center mb-6">Dagreflectie</h1>

      <div className="text-[14px] font-medium mb-2">Heb je je plan afgerond?</div>
      <div className="flex gap-2 mb-6">
        {([
          { id: "yes", label: "Helemaal" },
          { id: "partial", label: "Deels" },
          { id: "no", label: "Nog niet" },
        ] as { id: ReflectionCompletion; label: string }[]).map((opt) => (
          <div key={opt.id} className="flex-1">
            <ChoiceCard label={opt.label} selected={completed === opt.id} onClick={() => setCompleted(opt.id)} />
          </div>
        ))}
      </div>

      <div className="text-[14px] font-medium mb-2">Hoe voel je je nu?</div>
      <TextArea
        value={feeling}
        onChange={(e) => setFeeling(e.target.value)}
        placeholder="In een paar woorden..."
        className="mb-6"
        rows={3}
      />

      <div className="text-[14px] font-medium mb-2">Iets wat ik moet weten voor morgen?</div>
      <TextArea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Optioneel..."
        rows={3}
      />

      <Button
        className="mt-6"
        disabled={!completed}
        onClick={() =>
          completed && onSubmit({ completed_plan: completed, feeling_now: feeling, note_for_tomorrow: note })
        }
      >
        Opslaan
      </Button>
      <Button variant="secondary" className="mt-2.5" onClick={onCancel}>
        Terug naar plan
      </Button>
    </div>
  );
}
