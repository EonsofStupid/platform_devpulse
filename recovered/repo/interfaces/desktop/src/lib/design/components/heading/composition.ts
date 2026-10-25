/**
 * @file Heading Compositions — as const named presets
 * @kind heading
 *
 * Each composition overrides default token values for a visual family.
 * SD5 processes as mode-specific token groups.
 */

export const headingCompositions = {
	"neuro-glow": {
		"heading.root.color": "#e0f7fa",
		"heading.root.font-family": "{font.display}",
		"heading.root.letter-spacing": "-0.03em",
		"heading.root.text-shadow": "0 0 12px rgba(0, 200, 200, 0.4), 0 0 24px rgba(0, 200, 200, 0.15)",
	},
	"flat-clean": {
		"heading.root.color": "#e2e8f0",
		"heading.root.font-family": "{font.sans}",
		"heading.root.letter-spacing": "-0.01em",
		"heading.root.text-shadow": "none",
	},
	"display-bold": {
		"heading.root.color": "#ffffff",
		"heading.root.font-family": "{font.display}",
		"heading.root.letter-spacing": "-0.04em",
		"heading.root.text-shadow": "0 1px 2px rgba(0, 0, 0, 0.3)",
	},
} as const;
