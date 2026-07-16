// "Basic usage logging without storing unnecessary sensitive content."
// Logs only shape/metadata — route name, timestamp, success/failure,
// latency — never the actual request body (which could contain health
// notes, motivation statements, free-text reflections). Server console
// output only for now; swap console.log for a real log sink (Vercel's
// own log drain, or Axiom/Logtail) once one is chosen.
export function logApiUsage(route: string, outcome: "success" | "error" | "rate_limited" | "timeout", latencyMs?: number): void {
  console.log(
    JSON.stringify({
      type: "api_usage",
      route,
      outcome,
      latency_ms: latencyMs,
      timestamp: new Date().toISOString(),
    })
  );
}
