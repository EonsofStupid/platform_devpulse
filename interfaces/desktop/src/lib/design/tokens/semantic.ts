/**
 * @file src/lib/design/tokens/semantic.ts
 * @layer tokens
 *
 * Tier 2: Semantic Tokens — intent-based aliases referencing Tier 1 globals.
 * These express WHAT a value means, not WHAT it is.
 *
 * All values MUST be var() references to Tier 1 tokens.
 * Run `pnpm ds:tokens:build` to regenerate CSS from this file.
 *
 * @since 1.1.0
 */

export const semantic = {
	surface: {
		primary: "var(--glass-void)",
		elevated: "var(--glass-smoke)",
		overlay: "var(--glass-deep)",
		frosted: "var(--glass-frost)",
		muted: "var(--matte-dark)",
		"muted-medium": "var(--matte-medium)",
		"muted-light": "var(--matte-light)",
	},
	border: {
		subtle: "oklch(from var(--color-teal-700) l c h / 0.22)",
		soft: "oklch(from var(--color-teal-600) l c h / 0.30)",
		emphasis: "oklch(from var(--color-teal-500) l c h / 0.50)",
		focus: "var(--color-teal-400)",
		divider: "oklch(1 0 0 / 0.06)",
		"divider-faint": "oklch(1 0 0 / 0.04)",
	},
	interaction: {
		hover: "oklch(1 0 0 / 0.06)",
		active: "oklch(1 0 0 / 0.10)",
		selected: "oklch(1 0 0 / 0.15)",
	},
	overlay: {
		bg: "oklch(0.06 0.02 195 / 0.40)",
		"bg-heavy": "oklch(0.06 0.02 195 / 0.60)",
	},
	depth: {
		flat: "var(--shadow-z0)",
		raised: "var(--shadow-z1)",
		panel: "var(--shadow-z2)",
		overlay: "var(--shadow-z3)",
		modal: "var(--shadow-z4)",
	},
	transition: {
		instant: "var(--duration-instant) var(--ease-out)",
		fast: "var(--duration-fast) var(--ease-out)",
		normal: "var(--duration-normal) var(--ease-inOut)",
		slow: "var(--duration-slow) var(--ease-inOut)",
	},
	backdrop: {
		"glow-teal": "oklch(0.15 0.06 180 / 0.30)",
		"glow-purple": "oklch(0.15 0.08 280 / 0.25)",
		"glow-purple-fade": "oklch(0.10 0.04 180 / 0.10)",
		"grid-teal": "oklch(0.20 0.04 180 / 0.08)",
		"grid-purple": "oklch(0.22 0.05 280 / 0.06)",
	},
	scrollbar: {
		thumb: "oklch(1 0 0 / 0.12)",
		"thumb-hover": "oklch(1 0 0 / 0.20)",
	},
} as const;
