/**
 * @file Tooltip — Seed Style Presets
 * @kind tooltip
 * @package @devpulse/coldlight
 */

export const tooltipPresets = {
	"neuro-float": {
		"tooltip.content.background": "{glass.deep}",
		"tooltip.content.border.color": "{border.strong}",
		"tooltip.content.border-radius": "{radius.md}",
		"tooltip.content.shadow": "0 4px 12px rgba(0, 0, 0, 0.4)",
		"tooltip.content.color": "#e2e8f0",
		"tooltip.arrow.color": "{glass.deep}",
	},
	"flat-float": {
		"tooltip.content.background": "{surface.base}",
		"tooltip.content.border.color": "{border.divider}",
		"tooltip.content.border-radius": "{radius.sm}",
		"tooltip.content.shadow": "0 2px 6px rgba(0, 0, 0, 0.2)",
		"tooltip.content.color": "#e2e8f0",
		"tooltip.arrow.color": "{surface.base}",
	},
} as const;
