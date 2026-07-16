import { ChoiceCard } from "@/components/ui/ChoiceCard";
import { Button } from "@/components/ui/Button";
import { WEARABLE_OPTIONS } from "@/lib/onboardingOptions";
import type { WearableProvider } from "@/types/profile";

interface Props {
  provider: WearableProvider;
  onSelect: (provider: WearableProvider) => void;
  onNext: () => void;
}

// Onboarding-specific smartwatch selector — distinct from Module 1's
// checkin SmartwatchStep, which is a fixed "not connected" info screen.
// Same underlying limitation applies: no real device sync yet.
export function SmartwatchStep({ provider, onSelect, onNext }: Props) {
  return (
    <div className="flex flex-col justify-center h-full px-7">
      <h1 className="font-display font-bold text-[24px] text-center mb-1">Koppel je smartwatch</h1>
      <p className="text-center text-sm text-[#7A6F63] mb-6">Optioneel. Kan later alsnog.</p>

      <div className="flex flex-col gap-2 mb-6">
        {WEARABLE_OPTIONS.map((opt) => (
          <ChoiceCard
            key={opt.id}
            label={opt.label}
            selected={provider === opt.id}
            onClick={() => onSelect(opt.id)}
          />
        ))}
      </div>

      <Button onClick={onNext}>{provider ? "Volgende" : "Overslaan voor nu"}</Button>
    </div>
  );
}
