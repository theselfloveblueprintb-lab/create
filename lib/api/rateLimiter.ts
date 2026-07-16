// In-memory rate limiting — honest about its real limits: this counter
// lives in server process memory, so it resets on redeploy/cold start
// and isn't shared across multiple serverless instances. That's an
// acceptable tradeoff for a single-user private test deployment (which
// is what this is), but it is NOT a real distributed rate limiter. A
// production multi-user version would need Vercel KV/Upstash or
// equivalent shared storage — not built here, flagged instead.

interface Bucket {
  count: number;
  windowStart: number;
}

const buckets = new Map<string, Bucket>();

// Configurable daily limit for the private test version, per instruction.
// Read from env so it can be tuned per deployment without a code change.
const DAILY_LIMIT = parseInt(process.env.DAILY_AI_REQUEST_LIMIT ?? "150", 10);
const WINDOW_MS = 24 * 60 * 60 * 1000;

export function checkRateLimit(key: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now - bucket.windowStart > WINDOW_MS) {
    buckets.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: DAILY_LIMIT - 1 };
  }

  if (bucket.count >= DAILY_LIMIT) {
    return { allowed: false, remaining: 0 };
  }

  bucket.count += 1;
  return { allowed: true, remaining: DAILY_LIMIT - bucket.count };
}
