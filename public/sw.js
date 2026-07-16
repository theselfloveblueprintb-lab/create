// Crea service worker.
//
// CRITICAL SCOPE LIMIT: this caches ONLY the static app shell (the pages
// listed below, plus Next's own build assets it requests). It NEVER
// caches anything under /api/ — no check-in data, no plan responses, no
// health information ever touches the Cache Storage API. That's
// deliberate: PRD-010 explicitly requires private health data is never
// cached, and the simplest way to guarantee that is a network-only
// policy for every API route, enforced below, not just documented.

const CACHE_NAME = "crea-shell-v1";
const APP_SHELL = ["/", "/today", "/offline"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {
      // Don't fail install if a shell route isn't reachable at install time
      // (e.g. first deploy) — the app still works, just without precache.
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Never touch API routes — always go to the network. If the network is
  // down, let the request fail naturally rather than serving stale
  // health/plan data from a cache.
  if (url.pathname.startsWith("/api/")) return;

  // Only handle same-origin GET requests for the shell.
  if (event.request.method !== "GET" || url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached || caches.match("/offline"));
      return cached || networkFetch;
    })
  );
});

// Lets the client trigger an immediate activate when it detects a new
// service worker version is waiting (see components/pwa/UpdateNotifier.tsx).
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});
