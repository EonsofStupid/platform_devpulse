/**
 * @file Bevel Tokens — neuromorphic inset shadows
 * @module @devpulse/coldlight/tokens/effects/bevel
 * @layer tokens/tier-1
 */

export const bevel = {
	off: "none",
	subtle: "inset 0 1px 0 oklch(1 0 0 / 0.05)",
	soft: "inset 0 1px 1px oklch(1 0 0 / 0.08), inset 0 -1px 1px oklch(0 0 0 / 0.08)",
	medium: "inset 0 2px 2px oklch(1 0 0 / 0.10), inset 0 -2px 2px oklch(0 0 0 / 0.10)",
} as const;
