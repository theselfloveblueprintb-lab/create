"use client";

import { useState, useCallback } from "react";
import { ONBOARDING_STEP_ORDER, EMPTY_PROFILE, type UserProfile, type OnboardingStepId } from "@/types/profile";
import { saveProfile } from "@/lib/storage/profileRepository";

// Same pattern as useCheckinFlow (Module 1): steps stay dumb, this hook
// owns navigation, draft state, and persistence.
export function useOnboardingFlow() {
  const [stepIndex, setStepIndex] = useState(0);
  const [history, setHistory] = useState<number[]>([]);
  const [profile, setProfile] = useState<UserProfile>(EMPTY_PROFILE);
  const [completed, setCompleted] = useState(false);

  const step: OnboardingStepId = ONBOARDING_STEP_ORDER[stepIndex];

  const updateProfile = useCallback((patch: Partial<UserProfile>) => {
    setProfile((prev) => ({ ...prev, ...patch }));
  }, []);

  const toggleEquipment = useCallback((option: UserProfile["equipment"][number]) => {
    setProfile((prev) => {
      const has = prev.equipment.includes(option);
      return {
        ...prev,
        equipment: has ? prev.equipment.filter((e) => e !== option) : [...prev.equipment, option],
      };
    });
  }, []);

  const goNext = useCallback(() => {
    setHistory((prev) => [...prev, stepIndex]);
    setStepIndex((prev) => prev + 1);
  }, [stepIndex]);

  const goBack = useCallback(() => {
    setHistory((prev) => {
      if (prev.length === 0) return prev;
      const copy = [...prev];
      const last = copy.pop() as number;
      setStepIndex(last);
      return copy;
    });
  }, []);

  const finish = useCallback(async () => {
    const finalProfile: UserProfile = { ...profile, onboarding_completed: true };
    await saveProfile(finalProfile);
    setProfile(finalProfile);
    setCompleted(true);
  }, [profile]);

  return {
    step,
    stepIndex,
    canGoBack: history.length > 0 && step !== "finish",
    profile,
    completed,
    updateProfile,
    toggleEquipment,
    goNext,
    goBack,
    finish,
  };
}
