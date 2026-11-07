/**
 * @file Color Scales — OKLCH 9-step palettes
 * @module @devpulse/coldlight/tokens/color/scales
 * @layer tokens/tier-1
 *
 * Each scale: L (lightness 0-1), C (chroma 0-0.4), H (hue angle)
 * Run `pnpm ds:tokens:build` to regenerate CSS.
 */

export const hue = {
	teal: "180",
	purple: "280",
	magenta: "330",
	ember: "25",
	frost: "220",
	cyber: "160",
} as const;

export const color = {
	teal: {
		50: "oklch(0.97 0.02 180)",
		100: "oklch(0.92 0.04 180)",
		200: "oklch(0.84 0.08 180)",
		300: "oklch(0.74 0.12 180)",
		400: "oklch(0.64 0.16 180)",
		500: "oklch(0.55 0.18 180)",
		600: "oklch(0.48 0.16 180)",
		700: "oklch(0.40 0.13 180)",
		800: "oklch(0.32 0.10 180)",
		900: "oklch(0.24 0.07 180)",
	},
	purple: {
		50: "oklch(0.97 0.02 280)",
		100: "oklch(0.92 0.04 280)",
		200: "oklch(0.84 0.08 280)",
		300: "oklch(0.74 0.12 280)",
		400: "oklch(0.64 0.16 280)",
		500: "oklch(0.55 0.18 280)",
		600: "oklch(0.48 0.16 280)",
		700: "oklch(0.40 0.13 280)",
		800: "oklch(0.32 0.10 280)",
		900: "oklch(0.24 0.07 280)",
	},
	magenta: {
		50: "oklch(0.97 0.02 330)",
		100: "oklch(0.92 0.05 330)",
		200: "oklch(0.84 0.10 330)",
		300: "oklch(0.74 0.14 330)",
		400: "oklch(0.64 0.18 330)",
		500: "oklch(0.55 0.20 330)",
		600: "oklch(0.48 0.18 330)",
		700: "oklch(0.40 0.14 330)",
		800: "oklch(0.32 0.10 330)",
		900: "oklch(0.24 0.07 330)",
	},
	ember: {
		50: "oklch(0.97 0.02 25)",
		100: "oklch(0.92 0.05 25)",
		200: "oklch(0.84 0.10 25)",
		300: "oklch(0.74 0.14 25)",
		400: "oklch(0.64 0.16 25)",
		500: "oklch(0.55 0.18 25)",
		600: "oklch(0.48 0.16 25)",
		700: "oklch(0.40 0.13 25)",
		800: "oklch(0.32 0.10 25)",
		900: "oklch(0.24 0.07 25)",
	},
	frost: {
		50: "oklch(0.98 0.01 220)",
		100: "oklch(0.94 0.02 220)",
		200: "oklch(0.88 0.04 220)",
		300: "oklch(0.78 0.06 220)",
		400: "oklch(0.68 0.08 220)",
		500: "oklch(0.58 0.10 220)",
		600: "oklch(0.50 0.08 220)",
		700: "oklch(0.42 0.06 220)",
		800: "oklch(0.34 0.04 220)",
		900: "oklch(0.26 0.03 220)",
	},
	neutral: {
		50: "oklch(0.97 0 0)",
		100: "oklch(0.92 0 0)",
		200: "oklch(0.84 0 0)",
		300: "oklch(0.70 0 0)",
		400: "oklch(0.56 0 0)",
		500: "oklch(0.44 0 0)",
		600: "oklch(0.36 0 0)",
		700: "oklch(0.28 0 0)",
		800: "oklch(0.20 0 0)",
		900: "oklch(0.14 0 0)",
	},
	void: {
		base: "oklch(0.06 0.02 195)",
		800: "oklch(0.12 0.02 195)",
		900: "oklch(0.08 0.02 195)",
		950: "oklch(0.06 0.02 195)",
	},
	obsidian: {
		900: "oklch(0.06 0.02 195)",
		950: "oklch(0.04 0.01 195)",
	},
} as const;
