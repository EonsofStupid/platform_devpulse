/**
 * @file ColorSwatch — Seed Style Presets
 * @kind color-swatch
 * @package @devpulse/coldlight
 */

export const colorSwatchPresets = {
	"neuro-swatch": {
		"color-swatch.root.border.color": "{border.strong}",
		"color-swatch.root.border-radius": "{radius.md}",
		"color-swatch.root.shadow": "0 1px 3px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.06)",
	},
	"flat-swatch": {
		"color-swatch.root.border.color": "{border.divider}",
		"color-swatch.root.border-radius": "{radius.sm}",
		"color-swatch.root.shadow": "none",
	},
} as const;
