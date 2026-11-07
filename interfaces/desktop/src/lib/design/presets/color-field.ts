/**
 * @file ColorField — Seed Style Presets
 * @kind color-field
 * @package @devpulse/coldlight
 */

export const colorFieldPresets = {
	"neuro-inset": {
		"color-field.input.background": "{glass.void}",
		"color-field.input.border.color": "{border.strong}",
		"color-field.input.border-radius": "{radius.md}",
		"color-field.input.shadow": "inset 0 1px 2px rgba(0, 0, 0, 0.3)",
		"color-field.input.color": "#e2e8f0",
		"color-field.swatch.border-radius": "{radius.sm}",
	},
	"flat-input": {
		"color-field.input.background": "{surface.inset}",
		"color-field.input.border.color": "{border.divider}",
		"color-field.input.border-radius": "{radius.md}",
		"color-field.input.shadow": "none",
		"color-field.input.color": "#e2e8f0",
		"color-field.swatch.border-radius": "{radius.sm}",
	},
} as const;
