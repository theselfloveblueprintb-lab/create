import type { DailyPlan } from "@/types/planner";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

interface Props {
  plan: DailyPlan;
  onCantDoThis: () => void;
  onReflect: () => void;
}

export function PlanCard({ plan, onCantDoThis, onReflect }: Props) {
  return (
    <div className="flex-1 overflow-y-auto px-6 pt-6 pb-24">
      {plan.is_recovery_plan && (
        <div className="bg-[#F0F4F0] border border-sage text-[#3F5745] rounded-card p-3 text-[13px] mb-4">
          🌿 Vandaag is een herstelplan — dat is een even geldige keuze als trainen.
        </div>
      )}
      {plan.is_restart && !plan.is_recovery_plan && (
        <div className="bg-[#FBF2E4] border border-gold text-[#6B5320] rounded-card p-3 text-[13px] mb-4">
          💛 Fijn dat je er weer bent. We bouwen rustig weer op.
        </div>
      )}

      <div className="bg-ink text-white rounded-2xl p-5 mb-4">
        <div className="text-[11px] uppercase tracking-wide text-[#C9BBD1] mb-1.5">Vandaag</div>
        <div className="font-display font-semibold text-[21px] leading-snug mb-3">{plan.primary_goal}</div>
        {plan.reasoning_bullets && plan.reasoning_bullets.length > 0 ? (
          <ul className="space-y-1">
            {plan.reasoning_bullets.map((line, i) => (
              <li key={i} className="text-[13px] text-[#E4DAE8] leading-relaxed flex gap-2">
                <span className="text-[#C9BBD1]">•</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-[13px] text-[#E4DAE8] leading-relaxed">{plan.reasoning}</div>
        )}
      </div>

      {plan.calendar_mode === "travel" && plan.mode_suggestions.length > 0 && (
        <div className="rounded-card border-[1.5px] border-clay bg-[#FBF2ED] p-4 mb-3">
          <div className="text-[11px] uppercase tracking-wide text-[#7A4A34] mb-2">
            🚗 Onderweg — geen fysieke training
          </div>
          <ul className="space-y-1">
            {plan.mode_suggestions.map((s, i) => (
              <li key={i} className="text-[13.5px] text-[#7A4A34]">
                · {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {plan.calendar_mode && plan.calendar_mode !== "travel" && plan.calendar_mode !== "normal" && plan.mode_suggestions.length > 0 && (
        <div className="rounded-card border-[1.5px] border-line bg-white p-4 mb-3">
          <div className="text-[11px] uppercase tracking-wide text-[#9A8E80] mb-2">Ook een optie nu</div>
          <ul className="space-y-1">
            {plan.mode_suggestions.map((s, i) => (
              <li key={i} className="text-[13.5px] text-[#7A6F63]">
                · {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-card border-[1.5px] border-line bg-white p-4 mb-3">
        <div className="text-[11px] uppercase tracking-wide text-[#9A8E80] mb-2">Hoofdactiviteit</div>
        {plan.primary_workout.main.concat(plan.primary_workout.warmup, plan.primary_workout.cooldown).length === 0 ? (
          <div className="text-sm text-[#7A6F63]">Geen oefeningen beschikbaar vandaag.</div>
        ) : (
          <div className="space-y-2">
            {plan.primary_workout.main.map((e) => (
              <div key={e.exercise_id} className="text-[14px] font-medium">
                {e.name} — {e.prescribed_sets} × {e.prescribed_target}
                {e.prescription_type === "duration" ? "s" : " reps"}
              </div>
            ))}
          </div>
        )}
        <div className="text-xs text-[#9A8E80] mt-2">~{plan.available_minutes} minuten totaal</div>
      </div>

      {plan.secondary_activity && (
        <div className="rounded-card border-[1.5px] border-line bg-white p-4 mb-3">
          <div className="text-[11px] uppercase tracking-wide text-[#9A8E80] mb-1">Secundair (optioneel)</div>
          <div className="text-[14px]">{plan.secondary_activity}</div>
        </div>
      )}

      <div className="bg-[#FBF2ED] border border-clay rounded-card p-4 mb-5 text-[13.5px] text-[#7A4A34] leading-relaxed">
        {plan.coach_note}
      </div>

      {plan.calendar_mode !== "travel" && (
        <Link href="/training" className="block mb-2.5">
          <Button>Start training</Button>
        </Link>
      )}
      <Button variant="secondary" onClick={onCantDoThis} className="mb-2.5">
        Ik kan dit nu niet
      </Button>
      <Button variant="secondary" onClick={onReflect}>
        Dagreflectie invullen
      </Button>
    </div>
  );
}
