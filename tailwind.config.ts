import type { Config } from "tailwindcss";

// Design language carried over from the Module 1 prototype:
// warm, calm, self-love brand — not a generic "wellness gradient" palette.
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        clay: "#C97D60",
        ink: "#2E2438",
        blush: "#F7EFEA",
        sage: "#8FA792",
        gold: "#D4A24C",
        line: "#E8DDD3",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        body: ["var(--font-inter)", "sans-serif"],
      },
      borderRadius: {
        card: "14px",
        pill: "20px",
      },
    },
  },
  plugins: [],
};
export default config;
