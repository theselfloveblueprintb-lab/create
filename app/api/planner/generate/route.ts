import { NextRequest, NextResponse } from "next/server";
import { runPlanningSequence } from "@/lib/planner-algorithm/planningSequence";
import { checkRateLimit } from "@/lib/api/rateLimiter";
import { getClientKey } from "@/lib/api/getClientKey";
import { logApiUsage } from "@/lib/api/usageLog";
import type { UserProfile } from "@/types/profile";
import type { CheckinEntry } from "@/types/checkin";
import type { ExerciseMasteryRecord, WorkoutCompletionLog } from "@/types/workout";
import type { LocalCoachMemory } from "@/types/planner";
import type { CalendarMode, SelfCareWindow } from "@/types/calendar";

// As of PRD-006, this route delegates to the Planner Algorithm module.
// As of PRD-007, Coach Memory is also passed in from the client rather
// than read here. As of PRD-008, calendar windows/mode are passed in the
// same way. As of PRD-010 (finalization), rate limiting and usage
// logging were added at this outer boundary.

interface RequestBody {
  profile: UserProfile;
  todayCheckin: CheckinEntry | null;
  masteryRecords: Record<string, ExerciseMasteryRecord>;
  recentExerciseIds: string[];
  recentCompletions: WorkoutCompletionLog[];
  memoriesForPlanning: LocalCoachMemory[];
  selfCareWindows?: SelfCareWindow[];
  calendarMode?: CalendarMode | null;
}

export async function POST(req: NextRequest) {
  const startedAt = Date.now();
  const clientKey = getClientKey(req);

  const rateLimit = checkRateLimit(`planner:${clientKey}`);
  if (!rateLimit.allowed) {
    logApiUsage("api/planner/generate", "rate_limited");
    return NextResponse.json({ error: "daily_limit_reached" }, { status: 429 });
  }

  const body = (await req.json()) as RequestBody;

  try {
    const dailyPlan = await runPlanningSequence({
      profile: body.profile,
      todayCheckin: body.todayCheckin,
      masteryRecords: body.masteryRecords,
      recentExerciseIds: body.recentExerciseIds,
      recentCompletions: body.recentCompletions,
      memoriesForPlanning: body.memoriesForPlanning ?? [],
      selfCareWindows: body.selfCareWindows ?? [],
      calendarMode: body.calendarMode ?? null,
    });
    logApiUsage("api/planner/generate", "success", Date.now() - startedAt);
    return NextResponse.json(dailyPlan);
  } catch (err) {
    logApiUsage("api/planner/generate", "error", Date.now() - startedAt);
    console.error("Planner route failed", err);
    return NextResponse.json({ error: "planning_failed" }, { status: 500 });
  }
}
