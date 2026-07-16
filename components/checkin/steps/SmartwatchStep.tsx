import { Button } from "@/components/ui/Button";

interface Props {
  onNext: () => void;
}

// v1 always shows the "not connected" state — real device sync requires a
// native app or PWA with HealthKit/Google Fit permissions, which a plain
// web app cannot request. See README for the native-app migration note.
export function SmartwatchStep({ onNext }: Props) {
  return (
    <div className="flex flex-col justify-center h-full px-7">
      <div className="text-[44px] text-center mb-3.5">⌚</div>
      <h1 className="font-display font-bold text-[26px] text-center mb-4">Smartwatch</h1>
      <div className="rounded-card border-[1.5px] border-dashed border-line bg-white text-center text-[13px] text-[#7A6F63] p-4 mb-5">
        Nog niet gekoppeld. Rusthartslag, slaap, stappen en trainingen worden dan automatisch opgehaald.
      </div>
      <Button onClick={onNext}>Overslaan</Button>
    </div>
  );
}
