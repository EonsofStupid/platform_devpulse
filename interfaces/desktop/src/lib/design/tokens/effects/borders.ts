/**
 * @file Border Composite Tokens — named border styles
 * @module @devpulse/coldlight/tokens/effects/borders
 * @layer tokens/tier-1
 *
 * DTCG composite type "border" — SD5 auto-expands each into:
 *   --borderStyle-{name}-color
 *   --borderStyle-{name}-width
 *   --borderStyle-{name}-style
 *
 * Components consume individual expanded properties or the full composite.
 */

export interface BorderComposite {
	color: string;
	width: string;
	style: string;
}

export const borderStyle: Record<string, BorderComposite> = {
	/** Subtle borders for glass panels */
	subtle: {
		color: "oklch(from var(--color-teal-700) l c h / 0.22)",
		width: "1px",
		style: "solid",
	},
	/** Soft borders for cards and widgets */
	soft: {
		color: "oklch(from var(--color-teal-600) l c h / 0.30)",
		width: "1px",
		style: "solid",
	},
	/** Emphasis borders for active/selected elements */
	emphasis: {
		color: "oklch(from var(--color-teal-500) l c h / 0.50)",
		width: "1px",
		style: "solid",
	},
	/** Focus ring border */
	focus: {
		color: "var(--color-teal-400)",
		width: "2px",
		style: "solid",
	},
	/** Divider lines between sections */
	divider: {
		color: "oklch(1 0 0 / 0.06)",
		width: "1px",
		style: "solid",
	},
	/** Faint divider for tight layouts */
	"divider-faint": {
		color: "oklch(1 0 0 / 0.04)",
		width: "1px",
		style: "solid",
	},
	/** Accent teal border for highlighted elements */
	"accent-teal": {
		color: "var(--accent-teal-main)",
		width: "1px",
		style: "solid",
	},
	/** Accent purple border */
	"accent-purple": {
		color: "var(--accent-purple-main)",
		width: "1px",
		style: "solid",
	},
} as const;
