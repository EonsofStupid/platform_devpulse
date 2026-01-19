import type { Config } from "tailwindcss";

export default {
    content: ["./index.html", "./src/**/*.{svelte,js,ts,jsx,tsx}", "./**/*.svelte"],
    theme: {
        extend: {
            // OKLCH Color System
            colors: {
                // Void/Background
                void: {
                    950: "oklch(6% 0.02 195)",
                    900: "oklch(8% 0.02 195)",
                    800: "oklch(12% 0.02 195)",
                },
                // Obsidian (deeper blacks)
                obsidian: {
                    950: "oklch(4% 0.01 195)",
                    900: "oklch(6% 0.02 195)",
                },
                // Accent Teal (Primary)
                teal: {
                    500: "oklch(70% 0.2 195)",
                    400: "oklch(75% 0.2 195)",
                    300: "oklch(80% 0.18 195)",
                },
                // Accent Cyan
                cyan: {
                    500: "oklch(75% 0.15 200)",
                    400: "oklch(80% 0.15 200)",
                },
                // Accent Purple
                purple: {
                    500: "oklch(55% 0.25 300)",
                    400: "oklch(60% 0.25 300)",
                },
                // Accent Orange (Ember)
                ember: {
                    500: "oklch(70% 0.2 45)",
                    400: "oklch(75% 0.2 45)",
                },
                // Signals
                success: "oklch(70% 0.2 145)",
                warning: "oklch(75% 0.2 85)",
                error: "oklch(60% 0.25 25)",
            },
            // Content Hierarchy
            textColor: {
                primary: "var(--dp-text-primary)",
                secondary: "var(--dp-text-secondary)",
                muted: "var(--dp-text-muted)",
            },
            // Surfaces
            backgroundColor: {
                // Semantic mapping to tokens.css
                base: "var(--dp-surface-1)",
                sunken: "var(--dp-surface-2)",
                raised: "var(--dp-surface-3)",
                overlay: "var(--dp-surface-4)",
                
                // Accents
                cyber: "var(--dp-accent-cyber)",
                "cyber-tint": "var(--dp-accent-tint)",
                
                // Legacy/Glass (keep for GlassPanel)
                "glass-void": "oklch(6% 0.02 195 / 0.8)",
                "glass-deep": "oklch(8% 0.02 195 / 0.7)",
                "glass-smoke": "oklch(12% 0.02 195 / 0.6)",
                "glass-frost": "oklch(18% 0.02 195 / 0.5)",
            },
            // Blur scale
            blur: {
                xs: "2px",
                "2xl": "32px",
                "3xl": "48px",
            },
            // Font families
            fontFamily: {
                sans: ["Inter", "system-ui", "sans-serif"],
                mono: ["JetBrains Mono", "Fira Code", "monospace"],
            },
            // Spacing (fluid-ready)
            spacing: {
                "18": "4.5rem",
                "22": "5.5rem",
            },
            // Border radius
            borderRadius: {
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
        },
    },
    plugins: [],
} satisfies Config;
