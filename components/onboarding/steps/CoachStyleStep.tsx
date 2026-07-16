import { ChoiceCard } from "@/components/ui/ChoiceCard";
import { COACH_STYLE_OPTIONS } from "@/lib/onboardingOptions";
import type { CoachStyle } from "@/types/profile";

interface Props {
  value: CoachStyle | null;
  onSelect: (val: CoachStyle) => void;
}

export function CoachStyleStep({ value, onSelect }: Props) {
  return (
    <div className="flex flex-col justify-center h-full px-7">
      <h1 className="font-display font-bold text-[24px] text-center mb-1">Hoe wil je dat Crea je coacht?</h1>
      <p className="text-center text-sm text-[#7A6F63] mb-6">Dit kan later altijd nog veranderen.</p>
      <div className="flex flex-col gap-2">
        {COACH_STYLE_OPTIONS.map((opt) => (
          <ChoiceCard
            key={opt.id}
            emoji={opt.emoji}
            label={opt.label}
            selected={value === opt.id}
            onClick={() => onSelect(opt.id)}
          />
        ))}
      </div>
    </div>
  );
}
