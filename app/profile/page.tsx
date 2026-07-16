"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getProfile } from "@/lib/storage/profileRepository";
import { clearAllCalendarData } from "@/lib/storage/calendarRepository";
import { BottomNav } from "@/components/nav/BottomNav";
import { Button } from "@/components/ui/Button";
import type { UserProfile } from "@/types/profile";

// Settings/Profile hub. Also the honest home for data-mode disclosure —
// PRD-010 explicitly requires this app never claim Supabase sync is
// active when it isn't (see MIGRATION_PLAN.md — no live project exists).
export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    void getProfile().then(setProfile);
  }, []);

  async function handleExportAll() {
    const keys = Object.keys(localStorage).filter((k) => k.startsWith("crea:"));
    const data: Record<string, unknown> = {};
    keys.forEach((k) => {
      try {
        data[k] = JSON.parse(localStorage.getItem(k) ?? "null");
      } catch {
        data[k] = localStorage.getItem(k);
      }
    });
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `crea-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleDeleteAll() {
    const keys = Object.keys(localStorage).filter((k) => k.startsWith("crea:"));
    keys.forEach((k) => localStorage.removeItem(k));
    await clearAllCalendarData();
    window.location.href = "/onboarding";
  }

  if (!profile) {
    return (
      <div className="max-w-[480px] mx-auto h-screen flex items-center justify-center bg-blush">
        <div className="text-sm text-[#7A6F63]">Laden...</div>
      </div>
    );
  }

  return (
    <div className="max-w-[480px] mx-auto h-screen flex flex-col overflow-hidden bg-blush">
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <h1 className="font-display font-bold text-[24px] mb-1">
          {profile.first_name || "Jouw profiel"}
        </h1>
        <p className="text-sm text-[#7A6F63] mb-6">{profile.primary_goal}</p>

        <div className="rounded-card border-[1.5px] border-gold bg-[#FBF2E4] p-4 mb-6">
          <div className="text-[13px] font-semibold text-[#6B5320] mb-1">Lokale testmodus</div>
          <div className="text-[12.5px] text-[#6B5320] leading-relaxed">
            Al je gegevens staan alleen op dit toestel, in de opslag van deze browser. Er is geen
            account en geen synchronisatie tussen apparaten. Als je de browsergegevens of de app
            verwijdert, verdwijnt je geschiedenis — ook check-ins, voortgang en geleerde patronen.
            Een account-modus met veilige opslag in de cloud (Supabase) is voorbereid maar nog niet
            actief — zie de projectdocumentatie.
          </div>
        </div>

        <div className="space-y-2 mb-6">
          <Link href="/onboarding" className="block rounded-card border-[1.5px] border-line bg-white p-4 text-sm font-medium">
            Profielgegevens bewerken →
          </Link>
          <Link href="/memories" className="block rounded-card border-[1.5px] border-line bg-white p-4 text-sm font-medium">
            Wat Crea over je heeft geleerd →
          </Link>
          <Link href="/calendar-setup" className="block rounded-card border-[1.5px] border-line bg-white p-4 text-sm font-medium">
            Wekelijkse agenda instellen →
          </Link>
        </div>

        <div className="text-[12px] uppercase tracking-wide text-[#9A8E80] font-semibold mb-2">
          Privacy en gegevens
        </div>
        <Button variant="secondary" onClick={handleExportAll} className="mb-2.5">
          Exporteer al mijn gegevens
        </Button>

        {!confirmingDelete ? (
          <button onClick={() => setConfirmingDelete(true)} className="text-sm text-[#B4462E] font-medium">
            Alle gegevens verwijderen
          </button>
        ) : (
          <div className="rounded-card border-[1.5px] border-[#B4462E] bg-[#FBEDE8] p-4">
            <div className="text-[13px] text-[#7A2E1A] mb-3">
              Dit verwijdert alles permanent van dit toestel — check-ins, voortgang, geleerde
              patronen, agenda-instellingen. Dit kan niet ongedaan gemaakt worden.
            </div>
            <div className="flex gap-2">
              <button onClick={handleDeleteAll} className="text-sm font-semibold text-[#B4462E]">
                Ja, verwijder alles
              </button>
              <button onClick={() => setConfirmingDelete(false)} className="text-sm text-[#9A8E80]">
                Annuleren
              </button>
            </div>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
