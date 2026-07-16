import { SliderInput } from "@/components/ui/SliderInput";
import { Button } from "@/components/ui/Button";

interface Props {
  value: number;
  onChange: (val: number) => void;
  onNext: () => void;
}

export function StressStep({ value, onChange, onNext }: Props) {
  return (
    <div className="flex flex-col justify-center h-full px-7">
      <h1 className="font-display font-bold text-[26px] text-center mb-1.5">
        Hoeveel stress ervaar je vandaag?
      </h1>
      <SliderInput value={value} onChange={onChange} minLabel="Rustig" maxLabel="Overspannen" />
      <Button onClick={onNext} className="mt-6">
        Volgende
      </Button>
    </div>
  );
}
