/**
 * @file ColorSwatchPicker — Seed Style Presets
 * @kind color-swatch-picker
 * @package @devpulse/coldlight
 */

export const colorSwatchPickerPresets = {
	"neuro-grid": {
		"color-swatch-picker.root.gap": "8px",
		"color-swatch-picker.swatch.border.color": "{border.strong}",
		"color-swatch-picker.swatch.border-radius": "{radius.md}",
		"color-swatch-picker.swatch.shadow.selected": "0 0 0 3px rgba(45, 212, 191, 0.3)",
	},
	"flat-grid": {
		"color-swatch-picker.root.gap": "4px",
		"color-swatch-picker.swatch.border.color": "{border.divider}",
		"color-swatch-picker.swatch.border-radius": "{radius.sm}",
		"color-swatch-picker.swatch.shadow.selected": "0 0 0 2px #94a3b8",
	},
} as const;
