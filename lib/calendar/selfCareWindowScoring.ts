import type { CalendarBlock, SelfCareWindow } from "@/types/calendar";
import type { LocalCoachMemory } from "@/types/planner";

// Turns a day's blocks into scored, explained candidate windows — the
// core of "Self-Care Window" scoring. Every rule here is a real,
// inspectable heuristic, not an AI guess — reasons must be traceable to
// an actual input, matching PRD-008's own "Explain Planning" requirement.

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function findFreeGaps(blocks: CalendarBlock[]): { start: string; end: string }[] {
  const sorted = [...blocks].sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));
  const gaps: { start: string; end: string }[] = [];
  let cursor = 6 * 60; // day starts at 06:00 for scoring purposes
  const dayEnd = 22 * 60; // and ends at 22:00 — not proposing midnight workouts

  for (const block of sorted) {
    const blockStart = timeToMinutes(block.start_time);
    const blockEnd = timeToMinutes(block.end_time);
    if (blockStart > cursor) {
      gaps.push({ start: minutesToTime(cursor), end: minutesToTime(blockStart) });
    }
    cursor = Math.max(cursor, blockEnd);
  }
  if (cursor < dayEnd) gaps.push({ start: minutesToTime(cursor), end: minutesToTime(dayEnd) });

  return gaps.filter((g) => timeToMinutes(g.end) - timeToMinutes(g.start) >= 15); // ignore slivers under 15 min
}

function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60)
    .toString()
    .padStart(2, "0");
  const m = (mins % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

export function scoreSelfCareWindows(
  blocks: CalendarBlock[],
  dayOfWeek: number,
  confirmedMemories: LocalCoachMemory[]
): SelfCareWindow[] {
  const gaps = findFreeGaps(blocks);
  const dayNames = ["zondag", "maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag"];
  const todayName = dayNames[dayOfWeek];

  return gaps
    .map((gap) => {
      const startMin = timeToMinutes(gap.start);
      const duration = timeToMinutes(gap.end) - startMin;
      const reasons: string[] = [];
      let score = 50;
      let confidence = 70;

      // Morning bonus — before 10:00, matches PRD-008's own example.
      if (startMin < 10 * 60) {
        score += 25;
        reasons.push("Voor 10:00 — meestal de hoogste energie van de dag.");
      }
      // Late evening penalty — after 19:30, matches PRD-008's own example.
      if (startMin >= 19 * 60 + 30) {
        score -= 20;
        confidence -= 25;
        reasons.push("Laat op de avond — kans op onderbrekingen door kinderen.");
      }
      // Preceded directly by "work" -> "before work" bonus if gap ends right at a work block start.
      const followingBlock = blocks.find((b) => b.start_time === gap.end && b.availability_type === "work");
      if (followingBlock && startMin < 10 * 60) {
        score += 10;
        reasons.push("Direct voor werk — geen andere verplichtingen ertussen.");
      }
      // Long enough for a real session.
      if (duration >= 30) {
        score += 10;
      } else {
        score -= 10;
        reasons.push("Kort blok — alleen geschikt voor een korte sessie.");
      }

      // Coach Memory adjustment — confirmed schedule_pattern memories
      // directly move the score, since they're real, user-confirmed evidence.
      for (const memory of confirmedMemories) {
        if (memory.memory_type !== "schedule_pattern") continue;
        const mentionsToday = memory.statement.toLowerCase().includes(todayName);
        const soundsNegative = /druk|niet|lastig|moeilijk/.test(memory.statement.toLowerCase());
        const soundsPositive = /werkt goed|fijn|goed moment|hoge afronding/.test(memory.statement.toLowerCase());
        if (mentionsToday && soundsNegative) {
          score -= 20;
          confidence -= 20;
          reasons.push(`Bevestigd patroon: "${memory.statement}"`);
        } else if (mentionsToday && soundsPositive) {
          score += 15;
          confidence += 15;
          reasons.push(`Bevestigd patroon: "${memory.statement}"`);
        }
      }

      score = Math.max(0, Math.min(100, score));
      confidence = Math.max(0, Math.min(100, confidence));

      return {
        start_time: gap.start,
        end_time: gap.end,
        duration_minutes: duration,
        score,
        confidence,
        reasons: reasons.length > 0 ? reasons : ["Vrij blok zonder bijzonderheden."],
      };
    })
    .sort((a, b) => b.score - a.score);
}
