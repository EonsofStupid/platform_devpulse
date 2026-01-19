import type { Config } from "tailwindcss";
import { dpPreset } from "./lib/design/tokens/tailwind.preset";

/**
 * Tailwind CSS Configuration
 *
 * Uses dpPreset from the design system tokens for:
 * - Colors (dp-teal, dp-purple, etc.)
 * - Spacing (dp-1 through dp-8)
 * - Radius, blur, shadows, glows
 * - Grid utilities for shell layouts
 *
 * Additional app-specific utilities are defined below.
 */
export default {
    content: [
        "./index.html",
        "./src/**/*.{svelte,js,ts,jsx,tsx}",
        "./**/*.svelte",
        // CRITICAL: Include recipe files for Tailwind JIT
        "./lib/design/recipes/**/*.ts",
    ],
    theme: {
        extend: {
            // Spread the design system preset
            ...dpPreset.theme?.extend,

            // App-specific extensions (not in preset)
            colors: {
                // Spread preset colors
                ...dpPreset.theme?.extend?.colors,

                // Legacy void/obsidian (migration period)
                void: {
                    950: "oklch(6% 0.02 195)",
                    900: "oklch(8% 0.02 195)",
                    800: "oklch(12% 0.02 195)",
                },
                obsidian: {
                    950: "oklch(4% 0.01 195)",
                    900: "oklch(6% 0.02 195)",
                },

                // Signals (semantic)
                success: "oklch(70% 0.2 145)",
                warning: "oklch(75% 0.2 85)",
                error: "oklch(60% 0.25 25)",
            },

            // Legacy text colors (use dp-text-* from preset)
            textColor: {
                primary: "var(--dp-text-primary)",
                secondary: "var(--dp-text-secondary)",
                muted: "var(--dp-text-muted)",
            },

            // Legacy background (use dp-surface-* or dp-glass-* from preset)
            backgroundColor: {
                base: "var(--dp-surface-1)",
                sunken: "var(--dp-surface-2)",
                raised: "var(--dp-surface-3)",
                overlay: "var(--dp-surface-4)",
                cyber: "var(--dp-accent-cyber)",
                "cyber-tint": "var(--dp-accent-tint)",

                // Legacy glass (use bg-dp-glass-* instead)
                "glass-void": "oklch(6% 0.02 195 / 0.8)",
                "glass-deep": "oklch(8% 0.02 195 / 0.7)",
                "glass-smoke": "oklch(12% 0.02 195 / 0.6)",
                "glass-frost": "oklch(18% 0.02 195 / 0.5)",
            },

            // Additional blur scale
            blur: {
                ...dpPreset.theme?.extend?.blur,
                xs: "2px",
                "2xl": "32px",
                "3xl": "48px",
            },

            // Legacy font families (use font-dp-sans, font-dp-mono)
            fontFamily: {
                ...dpPreset.theme?.extend?.fontFamily,
                sans: ["Inter", "system-ui", "sans-serif"],
                mono: ["JetBrains Mono", "Fira Code", "monospace"],
            },

            // Additional spacing
            spacing: {
                ...dpPreset.theme?.extend?.spacing,
                "18": "4.5rem",
                "22": "5.5rem",
            },

            // Additional border radius
            borderRadius: {
                ...dpPreset.theme?.extend?.borderRadius,
                "2xl": "1rem",
                "3xl": "1.5rem",
            },

            // Animations
            animation: {
                "pulse-glow": "pulse-glow 4s ease-in-out infinite",
                "scan": "scan 8s ease-in-out infinite",
                "breathe": "breathe 6s ease-in-out infinite",
            },
            keyframes: {
                "pulse-glow": {
                    "0%, 100%": { opacity: "0.8" },
                    "50%": { opacity: "1" },
                },
                "scan": {
                    "0%": { top: "-2px", opacity: "0" },
                    "5%": { opacity: "1" },
                    "95%": { opacity: "1" },
                    "100%": { top: "100%", opacity: "0" },
                },
                "breathe": {
                    "0%, 100%": { opacity: "0.8" },
                    "50%": { opacity: "1" },
                },
            },

            // Grid utilities from preset
            gridTemplateColumns: dpPreset.theme?.extend?.gridTemplateColumns,
            gridTemplateRows: dpPreset.theme?.extend?.gridTemplateRows,
        },
    },
    plugins: [],
} satisfies Config;
