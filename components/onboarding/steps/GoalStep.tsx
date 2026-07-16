import { ChoiceCard } from "@/components/ui/ChoiceCard";
import { GOAL_OPTIONS } from "@/lib/onboardingOptions";
import type { PrimaryGoal } from "@/types/profile";

interface Props {
  value: PrimaryGoal | null;
  onSelect: (val: PrimaryGoal) => void;
}

export function GoalStep({ value, onSelect }: Props) {
  return (
    <div className="flex flex-col justify-center h-full px-7">
      <h1 className="font-display font-bold text-[24px] text-center mb-1">Wat is je belangrijkste doel?</h1>
      <p className="text-center text-sm text-[#7A6F63] mb-6">Op dit moment.</p>
      <div className="flex flex-col gap-2">
        {GOAL_OPTIONS.map((g) => (
          <ChoiceCard key={g} label={g} selected={value === g} onClick={() => onSelect(g)} />
        ))}
      </div>
    </div>
  );
}
