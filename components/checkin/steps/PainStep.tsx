import { SliderInput } from "@/components/ui/SliderInput";
import { Button } from "@/components/ui/Button";
import type { BodyStatus, FootStatus } from "@/types/checkin";

const BODY_OPTIONS: BodyStatus[] = ["Fris", "Licht stijf", "Erg stijf"];

const FOOT_STATUS_OPTIONS: { id: FootStatus; label: string }[] = [
  { id: "no_pain", label: "Geen pijn" },
  { id: "mild_discomfort", label: "Licht ongemak" },
  { id: "moderate_pain", label: "Matige pijn" },
  { id: "severe_pain", label: "Hevige pijn" },
  { id: "awaiting_assessment", label: "Wacht op beoordeling" },
];

interface Props {
  footPain: number;
  onFootPainChange: (val: number) => void;
  footStatus: FootStatus;
  onFootStatusChange: (val: FootStatus) => void;
  bodyStatus: BodyStatus | null;
  onBodyStatusChange: (val: BodyStatus) => void;
  onNext: () => void;
}

// Updated per direct instruction: no default "locked until cleared" state.
// The category below is descriptive context for you and for Crea's
// reasoning — it never overrides the 0-10 score as the actual safety
// gate (see lib/workout/safetyFilter.ts). "awaiting_assessment" is not
// treated as an automatic block; it's informational, same as the others.
export function PainStep({
  footPain,
  onFootPainChange,
  footStatus,
  onFootStatusChange,
  bodyStatus,
  onBodyStatusChange,
  onNext,
}: Props) {
  return (
    <div className="flex flex-col justify-center h-full px-7">
      <h1 className="font-display font-bold text-[26px] text-center mb-1.5">
        Hoe voelt je lichaam vandaag?
      </h1>
      <p className="text-center text-sm text-[#7A6F63] mb-1">Voet</p>

      <div className="flex flex-wrap gap-2 justify-center mb-3">
        {FOOT_STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            onClick={() => onFootStatusChange(opt.id)}
            className={`px-3 py-2 rounded-pill text-[12.5px] font-medium border-[1.5px] ${
              footStatus === opt.id ? "border-clay bg-[#FBF2ED]" : "border-line bg-white"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <SliderInput
        value={footPain}
        onChange={onFootPainChange}
        minLabel="Geen pijn"
        maxLabel="Hevige pijn"
      />

      <p className="text-[11.5px] text-[#9A8E80] text-center mt-1 mb-4 leading-relaxed px-2">
        Stop direct met een oefening als de pijn plotseling toeneemt, je manier van lopen
        verandert, of er zwelling ontstaat. Dit is geen medisch advies — raadpleeg bij twijfel
        een zorgverlener.
      </p>

      <div className="text-xs font-semibold uppercase tracking-wide text-[#9A8E80] mt-1 mb-2.5">
        Overig lichaam
      </div>
      <div className="flex gap-2">
        {BODY_OPTIONS.map((opt) => (
          <div
            key={opt}
            onClick={() => onBodyStatusChange(opt)}
            className={`flex-1 text-center px-1.5 py-3 rounded-card border-[1.5px] text-[13px] font-medium cursor-pointer
              ${bodyStatus === opt ? "border-sage bg-[#F0F4F0]" : "border-line bg-white"}`}
          >
            {opt}
          </div>
        ))}
      </div>
      <Button onClick={onNext} className="mt-6">
        Volgende
      </Button>
    </div>
  );
}
