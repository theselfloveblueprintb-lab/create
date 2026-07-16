// Wraps any promise (specifically: Anthropic API calls) with a hard
// timeout, so a slow/hung upstream request can't hold a serverless
// function open indefinitely or leave the user staring at a spinner
// forever. On timeout, the caller's existing deterministic fallback
// path handles it — this just makes sure that fallback actually gets a
// chance to run in a bounded time.
export function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)),
  ]);
}
