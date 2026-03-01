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

/** Pre-composed glow box-shadows */
export const glow = {
	off: "none",
	teal: "0 0 12px oklch(0.55 0.18 180 / 0.4)",
	purple: "0 0 12px oklch(0.55 0.18 280 / 0.4)",
	magenta: "0 0 12px oklch(0.55 0.20 330 / 0.4)",
	ember: "0 0 12px oklch(0.55 0.18 25 / 0.4)",
	frost: "0 0 12px oklch(0.58 0.10 220 / 0.4)",
	cyber: "0 0 12px oklch(0.55 0.18 160 / 0.4)",
} as const;
