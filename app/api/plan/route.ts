import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { buildSystemPrompt } from "@/lib/ai/systemPrompt";
import { getRecentCheckins } from "@/lib/storage/checkinRepository";
import { checkRateLimit } from "@/lib/api/rateLimiter";
import { getClientKey } from "@/lib/api/getClientKey";
import { validateCheckinEntry } from "@/lib/api/validateCheckinEntry";
import { withTimeout } from "@/lib/api/withTimeout";
import { logApiUsage } from "@/lib/api/usageLog";
import { FALLBACK_PLAN } from "@/lib/ai/generatePlan";
import type { CheckinEntry, DailyPlan } from "@/types/checkin";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const ANTHROPIC_TIMEOUT_MS = 15000;

export async function POST(req: NextRequest) {
  const startedAt = Date.now();
  const clientKey = getClientKey(req);

  const rateLimit = checkRateLimit(`plan:${clientKey}`);
  if (!rateLimit.allowed) {
    logApiUsage("api/plan", "rate_limited");
    // Deterministic fallback, not a hard error — the app stays usable
    // even when the daily AI budget is spent.
    return NextResponse.json(FALLBACK_PLAN, { status: 200 });
  }

  const body = await req.json().catch(() => null);
  if (!body || !validateCheckinEntry(body.entry)) {
    logApiUsage("api/plan", "error");
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }
  const entry = body.entry as CheckinEntry;

  const recent = await getRecentCheckins(5);
  const systemPrompt = buildSystemPrompt(entry.foot_status, recent, entry.foot_pain);

  try {
    const message = await withTimeout(
      anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: "user", content: `Check-in van vandaag: ${JSON.stringify(entry)}` }],
      }),
      ANTHROPIC_TIMEOUT_MS,
      "api/plan"
    );

    const textBlock = message.content.find((b) => b.type === "text");
    const raw = textBlock && "text" in textBlock ? textBlock.text : "";
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const plan = JSON.parse(cleaned) as DailyPlan;

    logApiUsage("api/plan", "success", Date.now() - startedAt);
    return NextResponse.json(plan);
  } catch (err) {
    const timedOut = err instanceof Error && err.message.includes("timed out");
    logApiUsage("api/plan", timedOut ? "timeout" : "error", Date.now() - startedAt);
    console.error("Crea plan generation failed", err);
    // Deterministic, non-AI fallback — the app remains usable without
    // API credits or when the AI call fails/times out.
    return NextResponse.json(FALLBACK_PLAN, { status: 200 });
  }
}
