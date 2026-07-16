"use client";

import { useRouter } from "next/navigation";
import { useOnboardingFlow } from "@/hooks/useOnboardingFlow";
import { ProgressDots } from "@/components/ui/ProgressDots";
import { BackButton } from "@/components/ui/BackButton";
import { WelcomeStep } from "./steps/WelcomeStep";
import { PersonalInfoStep } from "./steps/PersonalInfoStep";
import { HealthStep } from "./steps/HealthStep";
import { EquipmentStep } from "./steps/EquipmentStep";
import { CalendarStep } from "./steps/CalendarStep";
import { SmartwatchStep } from "./steps/SmartwatchStep";
import { GoalStep } from "./steps/GoalStep";
import { WhyStep } from "./steps/WhyStep";
import { TimeStep } from "./steps/TimeStep";
import { CoachStyleStep } from "./steps/CoachStyleStep";
import { FinishStep } from "./steps/FinishStep";
import { Button } from "@/components/ui/Button";

// Orchestrator only, mirroring components/checkin/CheckinFlow.tsx.
// No business logic here — useOnboardingFlow owns all of it.
export function OnboardingFlow() {
  const router = useRouter();
  const {
    step,
    stepIndex,
    canGoBack,
    profile,
    completed,
    updateProfile,
    toggleEquipment,
    goNext,
    goBack,
    finish,
  } = useOnboardingFlow();

  // Dots cover personal..coach_style (9 interactive steps), excluding welcome/finish bookends.
  const dotsTotal = 9;
  const dotIndex = stepIndex - 1;

  if (completed) {
    return (
      <div className="max-w-[480px] mx-auto h-screen flex flex-col items-center justify-center px-7 text-center">
        <div className="text-[38px] mb-3">✅</div>
        <h1 className="font-display font-bold text-[22px] mb-2">Profiel opgeslagen</h1>
        <p className="text-sm text-[#7A6F63] mb-6">
          Volgende stap: je ochtend check-in, zodat Crea je eerste plan kan maken.
        </p>
        <Button onClick={() => router.push("/checkin")}>Naar je check-in</Button>
      </div>
    );
  }

  return (
    <div className="relative max-w-[480px] mx-auto h-screen flex flex-col overflow-hidden">
      <BackButton onClick={goBack} visible={canGoBack} />
      {step !== "welcome" && step !== "finish" && (
        <ProgressDots total={dotsTotal} current={dotIndex} />
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        {step === "welcome" && <WelcomeStep onNext={goNext} />}

        {step === "personal" && (
          <PersonalInfoStep profile={profile} onChange={updateProfile} onNext={goNext} />
        )}

        {step === "health" && (
          <HealthStep profile={profile} onChange={updateProfile} onNext={goNext} />
        )}

        {step === "equipment" && (
          <EquipmentStep selected={profile.equipment} onToggle={toggleEquipment} onNext={goNext} />
        )}

        {step === "calendar" && (
          <CalendarStep
            provider={profile.calendar_provider}
            onSelect={(p) => updateProfile({ calendar_provider: p })}
            onNext={goNext}
          />
        )}

        {step === "smartwatch" && (
          <SmartwatchStep
            provider={profile.wearable_provider}
            onSelect={(p) => updateProfile({ wearable_provider: p })}
            onNext={goNext}
          />
        )}

        {step === "goal" && (
          <div className="flex-1 overflow-y-auto">
            <GoalStep
              value={profile.primary_goal}
              onSelect={(g) => {
                updateProfile({ primary_goal: g });
                goNext();
              }}
            />
          </div>
        )}

        {step === "why" && (
          <WhyStep
            value={profile.motivation_statement}
            onChange={(val) => updateProfile({ motivation_statement: val })}
            onNext={goNext}
          />
        )}

        {step === "time" && (
          <TimeStep
            value={profile.available_time}
            onSelect={(t) => {
              updateProfile({ available_time: t });
              goNext();
            }}
          />
        )}

        {step === "coach_style" && (
          <CoachStyleStep
            value={profile.coach_style}
            onSelect={(c) => {
              updateProfile({ coach_style: c });
              goNext();
            }}
          />
        )}

        {step === "finish" && <FinishStep onFinish={finish} />}
      </div>
    </div>
  );
}
