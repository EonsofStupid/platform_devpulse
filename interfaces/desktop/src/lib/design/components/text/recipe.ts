/**
 * @file Text Recipes — as const named presets
 * @kind text
 *
 * Each recipe overrides default token values for a visual family.
 * SD5 processes as mode-specific token groups.
 */

export const textRecipes = {
	"body-default": {
		"text.root.color.primary": "#e2e8f0",
		"text.root.font-family": "{font.sans}",
		"text.root.line-height": "1.5",
		"text.root.letter-spacing": "0em",
	},
	"caption-muted": {
		"text.root.color.primary": "#64748b",
		"text.root.font-family": "{font.sans}",
		"text.root.line-height": "1.4",
		"text.root.letter-spacing": "0.02em",
	},
	"code-mono": {
		"text.root.color.primary": "#2dd4bf",
		"text.root.font-family": "{font.mono}",
		"text.root.line-height": "1.6",
		"text.root.letter-spacing": "-0.01em",
	},
} as const;
