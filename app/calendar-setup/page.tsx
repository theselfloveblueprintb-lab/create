"use client";

import { useState, useEffect } from "react";
import { getWeeklyTemplate, saveWeeklyTemplate, clearAllCalendarData } from "@/lib/storage/calendarRepository";
import { Button } from "@/components/ui/Button";
import { BottomNav } from "@/components/nav/BottomNav";
import type { WeeklyTemplate, AvailabilityType, WorkLocation } from "@/types/calendar";

const DAY_NAMES = ["Zondag", "Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag"];
const TYPE_OPTIONS: AvailabilityType[] = ["work", "family", "busy", "travel", "sleep", "free", "flexible", "holiday"];
const TYPE_LABELS: Record<AvailabilityType, string> = {
  work: "Werk", family: "Familie", busy: "Bezet", travel: "Onderweg",
  sleep: "Slaap", free: "Vrij", flexible: "Flexibel", holiday: "Vakantie",
};

// Manual Mode setup (PRD-008). This is the ONLY calendar path that's
// genuinely functional right now — Google/Apple/Outlook remain
// unconfigured stubs (see chat). Seeded with sensible defaults matching
// your known weekly pattern; fully editable here.
export default function CalendarSetupPage() {
  const [template, setTemplate] = useState<WeeklyTemplate>([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void getWeeklyTemplate().then((t) => {
      setTemplate(t);
      setLoading(false);
    });
  }, []);

  function updateBlock(dayIndex: number, blockIndex: number, patch: Partial<WeeklyTemplate[number]["blocks"][number]>) {
    setTemplate((prev) => {
      const copy = structuredClone(prev);
      const day = copy.find((d) => d.day_of_week === dayIndex);
      if (day) Object.assign(day.blocks[blockIndex], patch);
      return copy;
    });
  }

  function addBlock(dayIndex: number) {
    setTemplate((prev) => {
      const copy = structuredClone(prev);
      let day = copy.find((d) => d.day_of_week === dayIndex);
      if (!day) {
        day = { day_of_week: dayIndex, blocks: [] };
        copy.push(day);
      }
      day.blocks.push({ start_time: "09:00", end_time: "10:00", availability_type: "busy", work_location: null, label: "Nieuw blok" });
      return copy;
    });
  }

  function removeBlock(dayIndex: number, blockIndex: number) {
    setTemplate((prev) => {
      const copy = structuredClone(prev);
      const day = copy.find((d) => d.day_of_week === dayIndex);
      if (day) day.blocks.splice(blockIndex, 1);
      return copy;
    });
  }

  async function handleSave() {
    await saveWeeklyTemplate(template);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleDisconnect() {
    await clearAllCalendarData();
    const fresh = await getWeeklyTemplate(); // falls back to defaults
    setTemplate(fresh);
  }

  if (loading) {
    return (
      <div className="max-w-[480px] mx-auto h-screen flex items-center justify-center bg-blush">
        <div className="text-sm text-[#7A6F63]">Laden...</div>
      </div>
    );
  }

  return (
    <div className="max-w-[480px] mx-auto h-screen flex flex-col overflow-hidden bg-blush">
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <h1 className="font-display font-bold text-[24px] mb-1">Jouw wekelijkse agenda</h1>
        <p className="text-sm text-[#7A6F63] mb-6">
          Handmatige modus — Crea gebruikt dit om vrije momenten te vinden. Google/Apple/Outlook-koppeling
          is nog niet beschikbaar.
        </p>

        {DAY_NAMES.map((name, dayIndex) => {
          const day = template.find((d) => d.day_of_week === dayIndex);
          return (
            <div key={dayIndex} className="mb-5">
              <div className="text-[13px] font-semibold mb-2">{name}</div>
              <div className="space-y-2 mb-2">
                {(day?.blocks ?? []).map((block, blockIndex) => (
                  <div key={blockIndex} className="rounded-card border-[1.5px] border-line bg-white p-3">
                    <div className="flex gap-2 mb-2">
                      <input
                        type="time"
                        value={block.start_time}
                        onChange={(e) => updateBlock(dayIndex, blockIndex, { start_time: e.target.value })}
                        className="flex-1 text-xs border border-line rounded px-2 py-1"
                      />
                      <input
                        type="time"
                        value={block.end_time}
                        onChange={(e) => updateBlock(dayIndex, blockIndex, { end_time: e.target.value })}
                        className="flex-1 text-xs border border-line rounded px-2 py-1"
                      />
                    </div>
                    <div className="flex gap-2 items-center">
                      <select
                        value={block.availability_type}
                        onChange={(e) =>
                          updateBlock(dayIndex, blockIndex, { availability_type: e.target.value as AvailabilityType })
                        }
                        className="flex-1 text-xs border border-line rounded px-2 py-1"
                      >
                        {TYPE_OPTIONS.map((t) => (
                          <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                        ))}
                      </select>
                      {block.availability_type === "work" && (
                        <select
                          value={block.work_location ?? ""}
                          onChange={(e) =>
                            updateBlock(dayIndex, blockIndex, { work_location: (e.target.value || null) as WorkLocation })
                          }
                          className="flex-1 text-xs border border-line rounded px-2 py-1"
                        >
                          <option value="">Locatie</option>
                          <option value="office">Kantoor</option>
                          <option value="home">Thuis</option>
                        </select>
                      )}
                      <button onClick={() => removeBlock(dayIndex, blockIndex)} className="text-[#B4462E] text-xs">
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => addBlock(dayIndex)} className="text-xs text-clay font-semibold">
                + Blok toevoegen
              </button>
            </div>
          );
        })}

        <Button onClick={handleSave} className="mt-2 mb-3">
          {saved ? "Opgeslagen ✓" : "Opslaan"}
        </Button>
        <button onClick={handleDisconnect} className="text-sm text-[#9A8E80]">
          Reset naar standaardagenda
        </button>
      </div>
      <BottomNav />
    </div>
  );
}
