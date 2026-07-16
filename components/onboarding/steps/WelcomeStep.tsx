import { Button } from "@/components/ui/Button";

interface Props {
  onNext: () => void;
}

export function WelcomeStep({ onNext }: Props) {
  return (
    <div className="flex flex-col justify-center h-full px-7">
      <div className="text-[38px] text-center mb-3.5">❤️</div>
      <h1 className="font-display font-bold text-[24px] text-center mb-3 leading-tight">
        Welkom bij Crea ❤️
      </h1>
      <p className="text-center text-sm text-[#7A6F63] mb-7 leading-relaxed">
        Voordat we beginnen wil ik je graag leren kennen, zodat ik je kan coachen op een manier die echt bij jouw leven past.
      </p>
      <Button onClick={onNext}>Laten we beginnen</Button>
    </div>
  );
}
