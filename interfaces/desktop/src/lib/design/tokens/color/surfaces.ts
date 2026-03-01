/**
 * @file Surface Materials — glass + matte fills
 * @module @devpulse/coldlight/tokens/color/surfaces
 * @layer tokens/tier-1
 */

export const glass = {
	void: "oklch(0.08 0.005 250 / 0.85)",
	deep: "oklch(0.11 0.01 250 / 0.75)",
	smoke: "oklch(0.16 0.005 0 / 0.60)",
	frost: "oklch(0.92 0.01 220 / 0.40)",
} as const;

export const matte = {
	dark: "oklch(0.14 0.005 250)",
	medium: "oklch(0.22 0.005 250)",
	light: "oklch(0.30 0.005 250)",
} as const;
