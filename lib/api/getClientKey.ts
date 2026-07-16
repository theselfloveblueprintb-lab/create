import type { NextRequest } from "next/server";

// Best-effort client identifier for rate limiting, in the absence of
// real authentication (see MIGRATION_PLAN.md — no auth system exists
// yet). Uses the forwarded IP on Vercel; falls back to a constant key,
// which effectively makes the limit global across all visitors until
// real auth exists. Acceptable for a single-user private test
// deployment, not for a real multi-user launch.
export function getClientKey(req: NextRequest): string {
  return req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "anonymous";
}
