/**
 * @file Surface Materials — glass + matte fills
 * @module @devpulse/coldlight/tokens/color/surfaces
 * @layer tokens/tier-1
 */

export const glass = {
	void: "oklch(0.06 0.01 210 / 0.88)",
	deep: "oklch(0.09 0.02 220 / 0.80)",
	smoke: "oklch(0.14 0.008 210 / 0.65)",
	frost: "oklch(0.92 0.01 220 / 0.40)",
	teal: "oklch(0.10 0.06 180 / 0.75)",
	purple: "oklch(0.10 0.06 280 / 0.75)",
} as const;

export const matte = {
	dark: "oklch(0.14 0.005 250)",
	medium: "oklch(0.22 0.005 250)",
	light: "oklch(0.30 0.005 250)",
} as const;
