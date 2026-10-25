/**
 * @file Bevel Tokens — neuromorphic inset shadows
 * @module @devpulse/coldlight/tokens/effects/bevel
 * @layer tokens/tier-1
 */

export const bevel = {
	off: "none",
	subtle: "inset 0 1px 0 oklch(1 0 0 / 0.08), inset 0 -1px 0 oklch(0 0 0 / 0.15)",
	soft: "inset 0 1px 2px oklch(1 0 0 / 0.12), inset 0 -1px 2px oklch(0 0 0 / 0.20)",
	medium: "inset 0 2px 4px oklch(1 0 0 / 0.15), inset 0 -2px 4px oklch(0 0 0 / 0.25)",
} as const;
