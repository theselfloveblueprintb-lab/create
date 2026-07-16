import { ChoiceCard } from "@/components/ui/ChoiceCard";
import type { EnergyLevel } from "@/types/checkin";

const OPTIONS: { emoji: string; label: string; val: EnergyLevel }[] = [
  { emoji: "😊", label: "Heel goed", val: "heel_goed" },
  { emoji: "🙂", label: "Goed", val: "goed" },
  { emoji: "😐", label: "Gaat wel", val: "gaat_wel" },
  { emoji: "😔", label: "Moe", val: "moe" },
  { emoji: "😩", label: "Uitgeput", val: "uitgeput" },
];

interface Props {
  value: EnergyLevel | null;
  onSelect: (val: EnergyLevel) => void;
}

export function EnergyStep({ value, onSelect }: Props) {
  return (
    <div className="flex flex-col justify-center h-full px-7">
      <h1 className="font-display font-bold text-[26px] text-center mb-1.5">Hoe voel je je vandaag?</h1>
      <p className="text-center text-sm text-[#7A6F63] mb-7">Eén tik is genoeg.</p>
      <div className="flex flex-col gap-2.5">
        {OPTIONS.map((o) => (
          <ChoiceCard
            key={o.val}
            emoji={o.emoji}
            label={o.label}
            selected={value === o.val}
            onClick={() => onSelect(o.val)}
          />
        ))}
      </div>
    </div>
  );
}
