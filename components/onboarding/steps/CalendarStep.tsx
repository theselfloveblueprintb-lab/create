import { ChoiceCard } from "@/components/ui/ChoiceCard";
import { Button } from "@/components/ui/Button";
import { CALENDAR_OPTIONS } from "@/lib/onboardingOptions";
import type { CalendarProvider } from "@/types/profile";

interface Props {
  provider: CalendarProvider;
  onSelect: (provider: CalendarProvider) => void;
  onNext: () => void;
}

// Selection only — no real OAuth handshake yet (see chat note).
// Choosing a provider still marks calendar_connected: false.
export function CalendarStep({ provider, onSelect, onNext }: Props) {
  return (
    <div className="flex flex-col justify-center h-full px-7">
      <h1 className="font-display font-bold text-[24px] text-center mb-1">Koppel je agenda</h1>
      <p className="text-center text-sm text-[#7A6F63] mb-6">
        Zodat Crea rekening houdt met je dag. Kan later alsnog.
      </p>

      <div className="flex flex-col gap-2 mb-6">
        {CALENDAR_OPTIONS.map((opt) => (
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
