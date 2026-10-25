/**
 * @file Typography Composite Tokens — named text styles
 * @module @devpulse/coldlight/tokens/typography/composites
 * @layer tokens/tier-1
 *
 * DTCG composite type "typography" — SD5 auto-expands each into:
 *   --textStyle-{name}-fontSize
 *   --textStyle-{name}-fontFamily
 *   --textStyle-{name}-fontWeight
 *   --textStyle-{name}-lineHeight
 *   --textStyle-{name}-letterSpacing
 *
 * Components consume individual expanded properties or the full composite.
 */

export interface TypographyComposite {
	fontSize: string;
	fontFamily: string;
	fontWeight: number;
	lineHeight: number;
	letterSpacing: string;
}

export const textStyle: Record<string, TypographyComposite> = {
	/** Page titles, hero text — Orbitron display */
	"display-lg": {
		fontSize: "2rem",
		fontFamily: '"Orbitron", system-ui, sans-serif',
		fontWeight: 700,
		lineHeight: 1.1,
		letterSpacing: "0.02em",
	},
	/** Section headings — Orbitron display */
	"display-sm": {
		fontSize: "1.5rem",
		fontFamily: '"Orbitron", system-ui, sans-serif',
		fontWeight: 600,
		lineHeight: 1.2,
		letterSpacing: "0.01em",
	},
	/** Widget titles, panel headers */
	"heading-lg": {
		fontSize: "1.25rem",
		fontFamily: '"Inter", system-ui, sans-serif',
		fontWeight: 600,
		lineHeight: 1.3,
		letterSpacing: "-0.01em",
	},
	/** Card titles, list headers */
	"heading-sm": {
		fontSize: "1rem",
		fontFamily: '"Inter", system-ui, sans-serif',
		fontWeight: 600,
		lineHeight: 1.4,
		letterSpacing: "-0.005em",
	},
	/** Default body text */
	body: {
		fontSize: "0.875rem",
		fontFamily: '"Inter", system-ui, sans-serif',
		fontWeight: 400,
		lineHeight: 1.5,
		letterSpacing: "0em",
	},
	/** Compact body — tables, dense lists */
	"body-sm": {
		fontSize: "0.8125rem",
		fontFamily: '"Inter", system-ui, sans-serif',
		fontWeight: 400,
		lineHeight: 1.45,
		letterSpacing: "0em",
	},
	/** Labels, badges, metadata */
	caption: {
		fontSize: "0.75rem",
		fontFamily: '"Inter", system-ui, sans-serif',
		fontWeight: 500,
		lineHeight: 1.4,
		letterSpacing: "0.01em",
	},
	/** Overline labels — uppercase, spaced */
	overline: {
		fontSize: "0.6875rem",
		fontFamily: '"Inter", system-ui, sans-serif',
		fontWeight: 600,
		lineHeight: 1.3,
		letterSpacing: "0.08em",
	},
	/** Code blocks and inline code */
	code: {
		fontSize: "0.8125rem",
		fontFamily: '"JetBrains Mono", "Fira Code", monospace',
		fontWeight: 400,
		lineHeight: 1.6,
		letterSpacing: "0em",
	},
	/** Dashboard stat values — large display numbers */
	stat: {
		fontSize: "1.5rem",
		fontFamily: '"Orbitron", system-ui, sans-serif',
		fontWeight: 700,
		lineHeight: 1.1,
		letterSpacing: "0.02em",
	},
} as const;
