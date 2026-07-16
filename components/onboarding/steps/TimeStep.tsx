import { ChoiceCard } from "@/components/ui/ChoiceCard";
import { TIME_OPTIONS } from "@/lib/onboardingOptions";
import type { AvailableTime } from "@/types/profile";

interface Props {
  value: AvailableTime | null;
  onSelect: (val: AvailableTime) => void;
}

export function TimeStep({ value, onSelect }: Props) {
  return (
    <div className="flex flex-col justify-center h-full px-7">
      <h1 className="font-display font-bold text-[24px] text-center mb-1">
        Hoeveel tijd kun je meestal aan jezelf besteden?
      </h1>
      <p className="text-center text-sm text-[#7A6F63] mb-6">Gemiddeld, per keer.</p>
      <div className="flex flex-col gap-2">
        {TIME_OPTIONS.map((t) => (
          <ChoiceCard key={t} label={t} selected={value === t} onClick={() => onSelect(t)} />
        ))}
      </div>
    </div>
  );
}
