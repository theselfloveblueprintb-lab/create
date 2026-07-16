import { TextArea } from "@/components/ui/TextArea";
import { Button } from "@/components/ui/Button";

interface Props {
  value: string;
  onChange: (val: string) => void;
  onNext: () => void;
}

export function WhyStep({ value, onChange, onNext }: Props) {
  return (
    <div className="flex flex-col justify-center h-full px-7">
      <h1 className="font-display font-bold text-[24px] text-center mb-1">Waarom is dit doel belangrijk voor je?</h1>
      <p className="text-center text-sm text-[#7A6F63] mb-5">
        "Ik wil gezonder worden zodat ik kan genieten van het leven met mijn kinderen."
      </p>
      <TextArea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Vertel het in je eigen woorden..."
      />
      <Button onClick={onNext} className="mt-5">
        Volgende
      </Button>
    </div>
  );
}
