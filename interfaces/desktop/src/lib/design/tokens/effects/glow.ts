/**
 * @file Glow Tokens — emission halos
 * @module @devpulse/coldlight/tokens/effects/glow
 * @layer tokens/tier-1
 */

/** Glow spread dimension — used by registry glow category */
export const glowSpread = {
	default: "12px",
	sm: "6px",
	lg: "20px",
	xl: "30px",
} as const;

/** Pre-composed glow box-shadows — bold cyberpunk halos (2-layer: tight + bloom) */
export const glow = {
	off: "none",
	teal: "0 0 20px oklch(0.60 0.20 180 / 0.6), 0 0 50px oklch(0.45 0.14 180 / 0.25)",
	purple: "0 0 20px oklch(0.60 0.20 280 / 0.6), 0 0 50px oklch(0.45 0.14 280 / 0.25)",
	magenta: "0 0 20px oklch(0.60 0.22 330 / 0.6), 0 0 50px oklch(0.45 0.16 330 / 0.25)",
	ember: "0 0 20px oklch(0.60 0.20 25 / 0.6), 0 0 50px oklch(0.45 0.14 25 / 0.25)",
	frost: "0 0 20px oklch(0.62 0.12 220 / 0.6), 0 0 50px oklch(0.48 0.08 220 / 0.25)",
	cyber: "0 0 20px oklch(0.60 0.20 160 / 0.6), 0 0 50px oklch(0.45 0.14 160 / 0.25)",
} as const;
