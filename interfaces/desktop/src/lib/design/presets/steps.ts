/**
 * @file Steps — Seed Style Presets
 * @kind steps
 * @package @devpulse/coldlight
 */

export const stepsPresets = {
	"neuro-connected": {
		"steps.indicator.background.complete": "rgba(45, 212, 191, 0.2)",
		"steps.indicator.background.active": "rgba(45, 212, 191, 0.1)",
		"steps.indicator.background.pending": "{glass.void}",
		"steps.indicator.border.color.complete": "{color.teal.400}",
		"steps.indicator.border.color.active": "{color.teal.400}",
		"steps.indicator.border.color.pending": "{border.strong}",
		"steps.indicator.color.complete": "{color.teal.400}",
		"steps.indicator.color.active": "{color.teal.400}",
		"steps.indicator.color.pending": "#64748b",
		"steps.connector.color.complete": "{color.teal.400}",
		"steps.connector.color.pending": "{border.subtle}",
		"steps.label.color": "#e2e8f0",
		"steps.description.color": "#64748b",
	},
	"flat-connected": {
		"steps.indicator.background.complete": "{surface.inset}",
		"steps.indicator.background.active": "transparent",
		"steps.indicator.background.pending": "transparent",
		"steps.indicator.border.color.complete": "#94a3b8",
		"steps.indicator.border.color.active": "#e2e8f0",
		"steps.indicator.border.color.pending": "{border.divider}",
		"steps.indicator.color.complete": "#e2e8f0",
		"steps.indicator.color.active": "#e2e8f0",
		"steps.indicator.color.pending": "#475569",
		"steps.connector.color.complete": "#94a3b8",
		"steps.connector.color.pending": "{border.divider}",
		"steps.label.color": "#e2e8f0",
		"steps.description.color": "#475569",
	},
} as const;
