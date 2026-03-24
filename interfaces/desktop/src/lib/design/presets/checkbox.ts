/**
 * @file Checkbox — Seed Style Presets
 * @kind checkbox
 * @package @devpulse/coldlight
 */

export const checkboxPresets = {
	"neuro-inset": {
		"checkbox.root.background.unchecked": "{glass.void}",
		"checkbox.root.background.checked": "rgba(45, 212, 191, 0.2)",
		"checkbox.root.border.color.unchecked": "{border.strong}",
		"checkbox.root.border.color.checked": "{color.teal.400}",
		"checkbox.root.border-radius": "{radius.sm}",
		"checkbox.root.shadow": "inset 0 1px 2px rgba(0, 0, 0, 0.3)",
		"checkbox.indicator.color": "{color.teal.400}",
	},
	"flat-square": {
		"checkbox.root.background.unchecked": "transparent",
		"checkbox.root.background.checked": "{surface.inset}",
		"checkbox.root.border.color.unchecked": "{border.divider}",
		"checkbox.root.border.color.checked": "#94a3b8",
		"checkbox.root.border-radius": "{radius.xs}",
		"checkbox.root.shadow": "none",
		"checkbox.indicator.color": "#e2e8f0",
	},
} as const;
