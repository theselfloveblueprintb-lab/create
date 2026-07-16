import { ChoiceCard } from "@/components/ui/ChoiceCard";
import { Button } from "@/components/ui/Button";
import { EQUIPMENT_OPTIONS } from "@/lib/onboardingOptions";
import type { EquipmentOption } from "@/types/profile";

interface Props {
  selected: EquipmentOption[];
  onToggle: (option: EquipmentOption) => void;
  onNext: () => void;
}

export function EquipmentStep({ selected, onToggle, onNext }: Props) {
  return (
    <div className="flex flex-col h-full px-7 overflow-y-auto py-6">
      <h1 className="font-display font-bold text-[24px] text-center mb-1">Welke uitrusting heb je?</h1>
      <p className="text-center text-sm text-[#7A6F63] mb-6">Selecteer alles wat van toepassing is.</p>

      <div className="flex flex-col gap-2 mb-6">
        {EQUIPMENT_OPTIONS.map((opt) => (
          <ChoiceCard
            key={opt}
            label={opt}
            selected={selected.includes(opt)}
            onClick={() => onToggle(opt)}
          />
        ))}
      </div>

      <Button onClick={onNext}>Volgende</Button>
    </div>
  );
}
