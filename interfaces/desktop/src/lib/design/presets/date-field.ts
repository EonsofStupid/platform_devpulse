/**
 * @file DateField + DatePicker + DateRangeField + DateRangePicker — Seed Style Presets
 * @kind date-field, date-picker, date-range-field, date-range-picker
 * @package @devpulse/coldlight
 */

export const dateFieldPresets = {
	"neuro-inset": {
		"date-field.input.background": "{glass.void}",
		"date-field.input.border.color": "{border.strong}",
		"date-field.input.border-radius": "{radius.lg}",
		"date-field.input.shadow": "inset 0 1px 2px rgba(0, 0, 0, 0.3)",
		"date-field.input.color": "#e2e8f0",
		"date-field.segment.color.placeholder": "#475569",
		"date-field.segment.background.focus": "rgba(45, 212, 191, 0.1)",
	},
	"flat-bordered": {
		"date-field.input.background": "{surface.inset}",
		"date-field.input.border.color": "{border.divider}",
		"date-field.input.border-radius": "{radius.md}",
		"date-field.input.shadow": "none",
		"date-field.input.color": "#e2e8f0",
		"date-field.segment.color.placeholder": "#334155",
		"date-field.segment.background.focus": "{surface.raised}",
	},
} as const;
