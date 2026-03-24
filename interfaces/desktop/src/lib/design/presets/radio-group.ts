/**
 * @file RadioGroup — Seed Style Presets
 * @kind radio-group
 * @package @devpulse/coldlight
 */

export const radioGroupPresets = {
	"neuro-inset": {
		"radio-group.item.background.unchecked": "{glass.void}",
		"radio-group.item.background.checked": "rgba(45, 212, 191, 0.15)",
		"radio-group.item.border.color.unchecked": "{border.strong}",
		"radio-group.item.border.color.checked": "{color.teal.400}",
		"radio-group.item.shadow": "inset 0 1px 2px rgba(0, 0, 0, 0.3)",
		"radio-group.indicator.color": "{color.teal.400}",
		"radio-group.label.color": "#e2e8f0",
	},
	"flat-circle": {
		"radio-group.item.background.unchecked": "transparent",
		"radio-group.item.background.checked": "transparent",
		"radio-group.item.border.color.unchecked": "{border.divider}",
		"radio-group.item.border.color.checked": "#94a3b8",
		"radio-group.item.shadow": "none",
		"radio-group.indicator.color": "#e2e8f0",
		"radio-group.label.color": "#e2e8f0",
	},
} as const;
