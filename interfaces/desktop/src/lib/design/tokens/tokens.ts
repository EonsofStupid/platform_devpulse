/**
 * @file src/lib/design/tokens/tokens.ts
 * @layer tokens
 *
 * @description
 * SSOT (Single Source of Truth) for ColdLight Design System tokens.
 * This file is the canonical definition - all other token files are GENERATED.
 *
 * DO NOT EDIT tokens.css, types.ts, or tailwind.preset.ts directly.
 * Run `pnpm ds:tokens:build` to regenerate them from this file.
 *
 * @generated-files
 * - tokens.css (CSS custom properties)
 * - types.ts (TypeScript types and runtime arrays)
 * - tailwind.preset.ts (Tailwind theme mapping)
 *
 * @since 1.0.0
 */

// ---------------------------------------------------------------------------
// Accent Hues (oklch hue channel)
// ---------------------------------------------------------------------------
export const hue = {
	teal: "180",
	purple: "280",
	magenta: "330",
	ember: "25",
	frost: "220",
	cyber: "160",
} as const;

// ---------------------------------------------------------------------------
// Color Scales — oklch(L C H) — 9-step scale per accent
// L: lightness 0-1, C: chroma 0-0.4, H: hue angle
// ---------------------------------------------------------------------------
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
		800: "oklch(0.12 0.02 195)",
		900: "oklch(0.08 0.02 195)",
		950: "oklch(0.06 0.02 195)",
	},
	obsidian: {
		900: "oklch(0.06 0.02 195)",
		950: "oklch(0.04 0.01 195)",
	},
} as const;

// ---------------------------------------------------------------------------
// Surface Materials
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Text
// ---------------------------------------------------------------------------
export const text = {
	primary: "oklch(0.95 0.01 250)",
	secondary: "oklch(0.75 0.01 250)",
	muted: "oklch(0.55 0.005 250)",
	inverted: "oklch(0.10 0 0)",
	link: "oklch(0.70 0.14 180)",
	error: "oklch(0.65 0.20 25)",
	success: "oklch(0.70 0.16 160)",
} as const;

// ---------------------------------------------------------------------------
// Spacing (rem scale — 1 unit = 0.25rem)
// ---------------------------------------------------------------------------
export const space = {
	1: "0.25rem",
	2: "0.5rem",
	3: "0.75rem",
	4: "1rem",
	5: "1.25rem",
	6: "1.5rem",
	8: "2rem",
} as const;

// ---------------------------------------------------------------------------
// Radius
// ---------------------------------------------------------------------------
export const radius = {
	none: "0",
	sm: "0.25rem",
	md: "0.5rem",
	lg: "0.75rem",
	xl: "1rem",
	full: "9999px",
} as const;

// ---------------------------------------------------------------------------
// Blur
// ---------------------------------------------------------------------------
export const blur = {
	off: "0",
	sm: "4px",
	md: "8px",
	lg: "16px",
	xl: "24px",
} as const;

// ---------------------------------------------------------------------------
// Glow (box-shadow with color)
// ---------------------------------------------------------------------------
export const glow = {
	off: "none",
	teal: "0 0 12px oklch(0.55 0.18 180 / 0.4)",
	purple: "0 0 12px oklch(0.55 0.18 280 / 0.4)",
	magenta: "0 0 12px oklch(0.55 0.20 330 / 0.4)",
	ember: "0 0 12px oklch(0.55 0.18 25 / 0.4)",
	frost: "0 0 12px oklch(0.58 0.10 220 / 0.4)",
	cyber: "0 0 12px oklch(0.55 0.18 160 / 0.4)",
} as const;

// ---------------------------------------------------------------------------
// Shadow (elevation)
// ---------------------------------------------------------------------------
export const shadow = {
	z0: "none",
	z1: "0 1px 3px oklch(0 0 0 / 0.12), 0 1px 2px oklch(0 0 0 / 0.24)",
	z2: "0 3px 6px oklch(0 0 0 / 0.15), 0 2px 4px oklch(0 0 0 / 0.12)",
	z3: "0 10px 20px oklch(0 0 0 / 0.15), 0 3px 6px oklch(0 0 0 / 0.10)",
	z4: "0 15px 25px oklch(0 0 0 / 0.15), 0 5px 10px oklch(0 0 0 / 0.05)",
} as const;

// ---------------------------------------------------------------------------
// Bevel (inset shadow)
// ---------------------------------------------------------------------------
export const bevel = {
	off: "none",
	subtle: "inset 0 1px 0 oklch(1 0 0 / 0.05)",
	soft: "inset 0 1px 1px oklch(1 0 0 / 0.08), inset 0 -1px 1px oklch(0 0 0 / 0.08)",
	medium: "inset 0 2px 2px oklch(1 0 0 / 0.10), inset 0 -2px 2px oklch(0 0 0 / 0.10)",
} as const;

// ---------------------------------------------------------------------------
// Z-Index
// ---------------------------------------------------------------------------
export const z = {
	base: "0",
	raised: "10",
	dropdown: "100",
	sticky: "200",
	overlay: "300",
	modal: "400",
	popover: "500",
	toast: "600",
	tooltip: "700",
} as const;

// ---------------------------------------------------------------------------
// Duration (animation)
// ---------------------------------------------------------------------------
export const duration = {
	instant: "50ms",
	fast: "150ms",
	normal: "250ms",
	slow: "400ms",
	glacial: "700ms",
} as const;

// ---------------------------------------------------------------------------
// Easing
// ---------------------------------------------------------------------------
export const ease = {
	linear: "linear",
	in: "cubic-bezier(0.4, 0, 1, 1)",
	out: "cubic-bezier(0, 0, 0.2, 1)",
	inOut: "cubic-bezier(0.4, 0, 0.2, 1)",
	spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
} as const;

// ---------------------------------------------------------------------------
// Text Size
// ---------------------------------------------------------------------------
export const textSize = {
	xs: "0.75rem",
	sm: "0.875rem",
	base: "1rem",
	lg: "1.125rem",
	xl: "1.25rem",
	"2xl": "1.5rem",
} as const;

// ---------------------------------------------------------------------------
// Padding (component-level)
// ---------------------------------------------------------------------------
export const padding = {
	sm: "0.375rem 0.75rem",
	md: "0.5rem 1rem",
	lg: "0.75rem 1.5rem",
} as const;

// ---------------------------------------------------------------------------
// Signal Colors (status indicators)
// ---------------------------------------------------------------------------
export const signal = {
	success: "oklch(0.70 0.20 145)",
	warning: "oklch(0.75 0.20 85)",
	error: "oklch(0.60 0.25 25)",
} as const;

// ---------------------------------------------------------------------------
// Fonts
// ---------------------------------------------------------------------------
export const font = {
	sans: '"Inter", system-ui, sans-serif',
	mono: '"JetBrains Mono", "Fira Code", monospace',
} as const;

// ---------------------------------------------------------------------------
// Animation
// ---------------------------------------------------------------------------
export const animation = {
	"pulse-glow": "pulse-glow 4s ease-in-out infinite",
} as const;

// ---------------------------------------------------------------------------
// Token enum arrays (used by types.ts generator)
// ---------------------------------------------------------------------------
export const enums = {
	accent: ["teal", "purple", "magenta", "ember", "frost"] as const,
	glow: ["off", "teal", "purple", "magenta", "ember", "frost", "cyber"] as const,
	surface: ["glass", "solid", "matte"] as const,
	glassVariant: ["void", "deep", "smoke", "frost"] as const,
	size: ["sm", "md", "lg"] as const,
	radius: ["none", "sm", "md", "lg", "xl", "full"] as const,
	blur: ["off", "sm", "md", "lg", "xl"] as const,
	depth: [0, 1, 2, 3, 4] as const,
	bevel: ["off", "subtle", "soft", "medium"] as const,
	tone: ["cold", "neutral", "warm"] as const,
	imprint: ["subtle", "medium", "strong"] as const,
	shellDepth: ["shallow", "standard", "deep"] as const,
	space: ["1", "2", "3", "4", "5", "6", "8"] as const,
	textSize: ["xs", "sm", "base", "lg", "xl", "2xl"] as const,
	padding: ["sm", "md", "lg"] as const,
} as const;
