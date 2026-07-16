"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getProfile } from "@/lib/storage/profileRepository";

// Root route now does real routing (PRD-010, "complete the real user
// flow"): first-time users go through onboarding once; returning users
// (onboarding_completed already true) skip straight to /today. Onboarding
// itself still lives at /onboarding and can always be revisited from
// /profile to edit answers.
export default function Home() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    void getProfile().then((profile) => {
      if (profile.onboarding_completed) {
        router.replace("/today");
      } else {
        router.replace("/onboarding");
      }
      setChecked(true);
    });
  }, [router]);

  // Brief, branded loading state during the redirect check — never a
  // blank white flash.
  return (
    <main className="max-w-[480px] mx-auto min-h-screen flex flex-col items-center justify-center px-7 text-center bg-blush">
      <div className="text-[38px] mb-3">❤️</div>
      <h1 className="font-display font-bold text-[28px] mb-2">Crea</h1>
      {!checked && <div className="text-sm text-[#7A6F63]">Een moment...</div>}
    </main>
  );
}
