import type { DailyPlan } from "@/types/checkin";

interface Props {
  plan: DailyPlan;
  onDone: () => void;
}

export function PlanResultStep({ plan, onDone }: Props) {
  return (
    <div className="flex-1 overflow-y-auto px-6 pt-5 pb-24">
      <div className="rounded-2xl bg-ink text-white p-5 mb-4">
        <div className="text-[11px] uppercase tracking-wide text-[#C9BBD1] mb-1.5">
          Jouw plan voor vandaag
        </div>
        <div className="font-display font-semibold text-[21px] leading-snug">{plan.hoofddoel}</div>
      </div>

      <PlanCard label="Aanbevolen training" value={plan.aanbevolen_training} />

      <div className="flex gap-2.5">
        <PlanCard label="Duur" value={plan.duur} compact />
        <PlanCard label="Intensiteit" value={plan.intensiteit} compact />
      </div>

      <PlanCard label="Beste tijdstip" value={plan.beste_tijdstip} />

      {plan.waarschuwingen && (
        <div className="rounded-card border-[1.5px] border-gold bg-[#FBF2E4] text-[#6B5320] text-[13.5px] leading-relaxed p-4 mb-3">
          💛 {plan.waarschuwingen}
        </div>
      )}

      {plan.alternatief && (
        <div className="rounded-card border-[1.5px] border-sage bg-[#F0F4F0] text-[#3F5745] text-[13.5px] leading-relaxed p-4 mb-3">
          🌿 Alternatief: {plan.alternatief}
        </div>
      )}

      <div className="sticky bottom-0 bg-gradient-to-t from-blush via-blush to-transparent pt-4 pb-2">
        <button
          onClick={onDone}
          className="w-full rounded-card px-5 py-4 text-[16px] font-semibold bg-ink text-white active:bg-[#1c1522]"
        >
          Klaar
        </button>
      </div>
    </div>
  );
}

function PlanCard({ label, value, compact }: { label: string; value: string; compact?: boolean }) {
  return (
    <div className={`rounded-card border-[1.5px] border-line bg-white p-4 mb-3 ${compact ? "flex-1" : ""}`}>
      <div className="text-[11px] uppercase tracking-wide text-[#9A8E80] mb-1">{label}</div>
      <div className="text-[15px] font-semibold leading-snug">{value || "—"}</div>
    </div>
  );
}
