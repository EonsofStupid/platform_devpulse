import type { Config } from "tailwindcss";

/**
 * Tailwind CSS Configuration
 * Minimal config - ColdLight tokens to be added later
 */
export default {
  content: [
    "./index.html",
    "./App.svelte",
    "./routes/**/*.svelte",
    "./lib/layouts/**/*.svelte",
    "./lib/domains/**/*.svelte",
    "./lib/sys/**/*.svelte",
  ],
  theme: {
    extend: {
      colors: {
        void: {
          950: "oklch(6% 0.02 195)",
          900: "oklch(8% 0.02 195)",
          800: "oklch(12% 0.02 195)",
        },
        obsidian: {
          950: "oklch(4% 0.01 195)",
          900: "oklch(6% 0.02 195)",
        },
        success: "oklch(70% 0.2 145)",
        warning: "oklch(75% 0.2 85)",
        error: "oklch(60% 0.25 25)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      animation: {
        "pulse-glow": "pulse-glow 4s ease-in-out infinite",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": { opacity: "0.8" },
          "50%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
