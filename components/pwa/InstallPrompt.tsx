"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari's own standalone flag
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

const DISMISSED_KEY = "crea:install-prompt-dismissed";

// One combined component covering both installation paths PRD-010 asks
// for: real Android/Chrome install via beforeinstallprompt, and iOS
// Safari's manual "Share -> Add to Home Screen" (there is no installable
// prompt event on iOS — Apple doesn't expose one — so that path is
// necessarily instructional, not automatic).
export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [dismissed, setDismissed] = useState(true); // default hidden until checked, avoids flash

  useEffect(() => {
    setDismissed(localStorage.getItem(DISMISSED_KEY) === "true");

    if (isStandalone()) return; // already installed — never show

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    if (isIOS()) setShowIOSInstructions(true);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, "true");
    setDismissed(true);
  }

  async function handleAndroidInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") setDeferredPrompt(null);
  }

  if (dismissed || isStandalone()) return null;
  if (!deferredPrompt && !showIOSInstructions) return null;

  return (
    <div className="rounded-card border-[1.5px] border-clay bg-[#FBF2ED] p-4 mx-6 mt-4">
      {deferredPrompt && (
        <>
          <div className="text-[13px] font-medium text-[#7A4A34] mb-2">
            Installeer Crea op je startscherm voor snellere toegang.
          </div>
          <div className="flex gap-2">
            <button onClick={handleAndroidInstall} className="text-sm font-semibold text-clay">
              Installeren
            </button>
            <button onClick={dismiss} className="text-sm text-[#9A8E80]">
              Niet nu
            </button>
          </div>
        </>
      )}
      {!deferredPrompt && showIOSInstructions && (
        <>
          <div className="text-[13px] font-medium text-[#7A4A34] mb-1">
            Zet Crea op je beginscherm:
          </div>
          <div className="text-[12.5px] text-[#7A4A34] leading-relaxed mb-2">
            Tik op <strong>Deel</strong> onderin Safari → <strong>Zet op beginscherm</strong> → open Crea vanaf
            het startscherm als app.
          </div>
          <button onClick={dismiss} className="text-sm text-[#9A8E80]">
            Niet nu
          </button>
        </>
      )}
    </div>
  );
}
