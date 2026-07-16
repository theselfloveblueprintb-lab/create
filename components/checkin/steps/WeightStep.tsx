"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

interface Props {
  onSubmit: (weight: number | null) => void;
}

export function WeightStep({ onSubmit }: Props) {
  const [entering, setEntering] = useState(false);
  const [value, setValue] = useState("");

  return (
    <div className="flex flex-col justify-center h-full px-7">
      <h1 className="font-display font-bold text-[26px] text-center mb-1.5">
        Wil je vandaag je gewicht invoeren?
      </h1>
      <p className="text-center text-sm text-[#7A6F63] mb-6">Helemaal optioneel.</p>

      {entering && (
        <div className="flex gap-2.5 mb-3.5">
          <input
            type="number"
            step="0.1"
            placeholder="kg"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="flex-1 rounded-card border-[1.5px] border-line px-3.5 py-3.5 text-center
                       font-display font-semibold text-lg"
          />
        </div>
      )}

      {!entering ? (
        <>
          <Button onClick={() => setEntering(true)}>Nu invoeren</Button>
          <Button variant="secondary" className="mt-2.5" onClick={() => onSubmit(null)}>
            Overslaan
          </Button>
        </>
      ) : (
        <Button
          onClick={() => {
            const parsed = parseFloat(value);
            onSubmit(parsed > 0 ? parsed : null);
          }}
        >
          Opslaan en verder
        </Button>
      )}
    </div>
  );
}
