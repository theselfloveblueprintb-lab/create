"use client";

import { useEffect, useState } from "react";

// "Update notification when a new version is available." Listens for a
// waiting service worker (installed but not yet active) and offers a
// one-tap reload — the standard PWA update pattern.
export function UpdateNotifier() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.ready.then((reg) => {
      setRegistration(reg);
      if (reg.waiting) setUpdateAvailable(true);

      reg.addEventListener("updatefound", () => {
        const newWorker = reg.installing;
        if (!newWorker) return;
        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            setUpdateAvailable(true);
          }
        });
      });
    });

    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
  }, []);

  if (!updateAvailable) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 max-w-[440px] mx-auto z-50 bg-ink text-white rounded-card px-4 py-3 flex items-center justify-between shadow-lg">
      <span className="text-sm">Nieuwe versie beschikbaar</span>
      <button
        onClick={() => registration?.waiting?.postMessage("SKIP_WAITING")}
        className="text-sm font-semibold text-clay"
      >
        Vernieuwen
      </button>
    </div>
  );
}
