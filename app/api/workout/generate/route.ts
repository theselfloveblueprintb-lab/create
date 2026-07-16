import { NextRequest, NextResponse } from "next/server";
import { generateWorkoutCore } from "@/lib/workout/generateWorkoutCore";
import { checkRateLimit } from "@/lib/api/rateLimiter";
import { getClientKey } from "@/lib/api/getClientKey";
import { logApiUsage } from "@/lib/api/usageLog";
import type { UserProfile } from "@/types/profile";
import type { CheckinEntry } from "@/types/checkin";
import type { ExerciseMasteryRecord } from "@/types/workout";

interface RequestBody {
  profile: UserProfile;
  todayCheckin: CheckinEntry | null;
  masteryRecords: Record<string, ExerciseMasteryRecord>;
  recentExerciseIds: string[];
}

// Thin wrapper only, as of PRD-004 — all logic now lives in
// generateWorkoutCore.ts so the Planner can call the identical pipeline.
// No behavior change from the PRD-003 version: no overrides passed here.
// Rate limiting + logging added in the finalization pass (PRD-010).
export async function POST(req: NextRequest) {
  const startedAt = Date.now();
  const clientKey = getClientKey(req);

  const rateLimit = checkRateLimit(`workout:${clientKey}`);
  if (!rateLimit.allowed) {
    logApiUsage("api/workout/generate", "rate_limited");
    return NextResponse.json({ error: "daily_limit_reached" }, { status: 429 });
  }

  const body = (await req.json()) as RequestBody;
  try {
    const workout = await generateWorkoutCore({ ...body });
    logApiUsage("api/workout/generate", "success", Date.now() - startedAt);
    return NextResponse.json(workout);
  } catch (err) {
    logApiUsage("api/workout/generate", "error", Date.now() - startedAt);
    console.error("Workout generation route failed", err);
    return NextResponse.json({ error: "generation_failed" }, { status: 500 });
  }
}
