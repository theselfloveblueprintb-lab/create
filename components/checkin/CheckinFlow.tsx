"use client";

import { useRouter } from "next/navigation";
import { useCheckinFlow } from "@/hooks/useCheckinFlow";
import { ProgressDots } from "@/components/ui/ProgressDots";
import { BackButton } from "@/components/ui/BackButton";
import { STEP_ORDER } from "@/types/checkin";
import { WelcomeStep } from "./steps/WelcomeStep";
import { EnergyStep } from "./steps/EnergyStep";
import { SleepStep } from "./steps/SleepStep";
import { StressStep } from "./steps/StressStep";
import { PainStep } from "./steps/PainStep";
import { WeightStep } from "./steps/WeightStep";
import { SmartwatchStep } from "./steps/SmartwatchStep";
import { LoadingStep } from "./steps/LoadingStep";
import { PlanResultStep } from "./steps/PlanResultStep";
import { FALLBACK_PLAN } from "@/lib/ai/generatePlan";

// Orchestrator only — no business logic lives here. Each step component
// is presentational; useCheckinFlow owns state, navigation, and persistence.
export function CheckinFlow() {
  const router = useRouter();
  const { step, stepIndex, canGoBack, entry, plan, updateEntry, goNext, goBack } =
    useCheckinFlow();

  // Dots only cover the interactive steps (welcome..smartwatch) — loading/result excluded.
  const dotsTotal = STEP_ORDER.length - 2;

  return (
    <div className="relative max-w-[480px] mx-auto h-screen flex flex-col overflow-hidden">
      <BackButton onClick={goBack} visible={canGoBack} />
      {step !== "loading" && step !== "result" && (
        <ProgressDots total={dotsTotal} current={stepIndex} />
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        {step === "welcome" && <WelcomeStep onNext={goNext} />}

        {step === "energy" && (
          <EnergyStep
            value={entry.energy_level}
            onSelect={(val) => {
              updateEntry({ energy_level: val });
              goNext();
            }}
          />
        )}

        {step === "sleep" && (
          <SleepStep
            value={entry.sleep_score}
            onSelect={(val) => {
              updateEntry({ sleep_score: val });
              goNext();
            }}
          />
        )}

        {step === "stress" && (
          <StressStep
            value={entry.stress_level}
            onChange={(val) => updateEntry({ stress_level: val })}
            onNext={goNext}
          />
        )}

        {step === "pain" && (
          <PainStep
            footPain={entry.foot_pain}
            onFootPainChange={(val) => updateEntry({ foot_pain: val })}
            footStatus={entry.foot_status}
            onFootStatusChange={(val) => updateEntry({ foot_status: val })}
            bodyStatus={entry.body_status}
            onBodyStatusChange={(val) => updateEntry({ body_status: val })}
            onNext={goNext}
          />
        )}

        {step === "weight" && (
          <WeightStep
            onSubmit={(w) => {
              updateEntry({ weight: w });
              goNext();
            }}
          />
        )}

        {step === "smartwatch" && <SmartwatchStep onNext={goNext} />}

        {step === "loading" && <LoadingStep />}

        {step === "result" && (
          <PlanResultStep
            plan={plan ?? FALLBACK_PLAN}
            onDone={() => router.push("/today")}
          />
        )}
      </div>
    </div>
  );
}
