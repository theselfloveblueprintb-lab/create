"use client";

import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
}

export function Button({ variant = "primary", className = "", children, ...props }: ButtonProps) {
  const base =
    "w-full rounded-card px-5 py-4 text-[16px] font-semibold font-body transition-colors active:scale-[0.99]";
  const styles =
    variant === "primary"
      ? "bg-ink text-white active:bg-[#1c1522]"
      : "bg-transparent text-ink border-[1.5px] border-line active:bg-[#F1E9E2]";

  return (
    <button className={`${base} ${styles} ${className}`} {...props}>
      {children}
    </button>
  );
}
