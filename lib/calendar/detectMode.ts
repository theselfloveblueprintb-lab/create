import type { CalendarBlock, CalendarMode } from "@/types/calendar";

// Mode detection is a straightforward read of today's blocks — no AI
// needed, matches PRD-008's own worked examples exactly.
export function detectCalendarMode(blocks: CalendarBlock[], dayOfWeek: number, currentTimeMinutes: number): CalendarMode {
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  const holidayBlock = blocks.find((b) => b.availability_type === "holiday");
  if (holidayBlock) return "holiday";

  const activeTravelBlock = blocks.find((b) => {
    if (b.availability_type !== "travel") return false;
    const [sh, sm] = b.start_time.split(":").map(Number);
    const [eh, em] = b.end_time.split(":").map(Number);
    const start = sh * 60 + sm;
    const end = eh * 60 + em;
    return currentTimeMinutes >= start && currentTimeMinutes < end;
  });
  if (activeTravelBlock) return "travel";

  if (isWeekend) return "weekend";

  const activeWorkBlock = blocks.find((b) => {
    if (b.availability_type !== "work") return false;
    const [sh, sm] = b.start_time.split(":").map(Number);
    const [eh, em] = b.end_time.split(":").map(Number);
    const start = sh * 60 + sm;
    const end = eh * 60 + em;
    return currentTimeMinutes >= start && currentTimeMinutes < end;
  });
  if (activeWorkBlock?.work_location === "home") return "home_office";
  if (activeWorkBlock?.work_location === "office") return "office";

  return "normal";
}
