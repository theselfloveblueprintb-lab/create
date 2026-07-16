import { Button } from "@/components/ui/Button";

interface Props {
  onNext: () => void;
  userName?: string;
}

export function WelcomeStep({ onNext, userName = "Evelien" }: Props) {
  return (
    <div className="flex flex-col justify-center h-full px-7">
      <div className="text-[38px] text-center mb-3.5">❤️</div>
      <h1 className="font-display font-bold text-[26px] text-center mb-1.5 leading-tight">
        Goedemorgen, {userName}
      </h1>
      <p className="text-center text-sm text-[#7A6F63] mb-6 leading-relaxed">
        Laten we vandaag bewust voor jezelf kiezen.
      </p>
      <Button onClick={onNext}>Start check-in</Button>
    </div>
  );
}
