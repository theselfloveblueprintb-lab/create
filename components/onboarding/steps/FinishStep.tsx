import { Button } from "@/components/ui/Button";

interface Props {
  onFinish: () => void;
}

export function FinishStep({ onFinish }: Props) {
  return (
    <div className="flex flex-col justify-center h-full px-7">
      <div className="text-[38px] text-center mb-3.5">❤️</div>
      <h1 className="font-display font-bold text-[24px] text-center mb-2">Je bent helemaal klaar ❤️</h1>
      <p className="text-center text-sm text-[#7A6F63] mb-7 leading-relaxed">
        Ik kijk ernaar uit om je te helpen elke dag voor jezelf te kiezen.
      </p>
      <Button onClick={onFinish}>Maak mijn persoonlijke plan</Button>
    </div>
  );
}
