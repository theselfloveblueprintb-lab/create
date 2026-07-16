import { StarRating } from "@/components/ui/StarRating";

interface Props {
  value: number | null;
  onSelect: (val: number) => void;
}

export function SleepStep({ value, onSelect }: Props) {
  return (
    <div className="flex flex-col justify-center h-full px-7">
      <h1 className="font-display font-bold text-[26px] text-center mb-1.5">Hoe heb je geslapen?</h1>
      <p className="text-center text-sm text-[#7A6F63] mb-2">Geef een score van 1 tot 5 sterren.</p>
      <StarRating value={value} onChange={onSelect} />
    </div>
  );
}
