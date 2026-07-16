"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/today", label: "Vandaag", icon: "☀️" },
  { href: "/checkin", label: "Check-in", icon: "❤️" },
  { href: "/training", label: "Training", icon: "💪" },
  { href: "/progress", label: "Voortgang", icon: "📈" },
  { href: "/profile", label: "Profiel", icon: "⚙️" },
];

// Shared across the five main screens PRD-010 asks for. Deliberately a
// plain component included per-page rather than a route-group layout —
// avoids restructuring already-working page paths for every module.
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="flex-shrink-0 border-t border-line bg-white flex items-stretch">
      {ITEMS.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10.5px] font-medium ${
              active ? "text-clay" : "text-[#9A8E80]"
            }`}
          >
            <span className="text-[18px]">{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
