/**
 * @file Shadow Tokens — z-elevation drop shadows
 * @module @devpulse/coldlight/tokens/effects/shadow
 * @layer tokens/tier-1
 */

export const shadow = {
	z0: "none",
	z1: "0 1px 3px oklch(0 0 0 / 0.12), 0 1px 2px oklch(0 0 0 / 0.24)",
	z2: "0 3px 6px oklch(0 0 0 / 0.15), 0 2px 4px oklch(0 0 0 / 0.12)",
	z3: "0 10px 20px oklch(0 0 0 / 0.15), 0 3px 6px oklch(0 0 0 / 0.10)",
	z4: "0 15px 25px oklch(0 0 0 / 0.15), 0 5px 10px oklch(0 0 0 / 0.05)",
} as const;
