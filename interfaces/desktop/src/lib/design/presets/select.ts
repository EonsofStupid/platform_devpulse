/**
 * @file Select — Seed Style Presets
 * @kind select
 * @package @devpulse/coldlight
 */

export const selectPresets = {
	"neuro-dropdown": {
		"select.trigger.background": "{glass.void}",
		"select.trigger.border.color": "{border.strong}",
		"select.trigger.border-radius": "{radius.lg}",
		"select.trigger.shadow": "inset 0 1px 2px rgba(0, 0, 0, 0.3)",
		"select.trigger.color": "#e2e8f0",
		"select.content.background": "{glass.deep}",
		"select.content.border.color": "{border.strong}",
		"select.content.border-radius": "{radius.lg}",
		"select.content.shadow": "0 4px 16px rgba(0, 0, 0, 0.4)",
		"select.item.background.hover": "{glass.smoke}",
		"select.item.color": "#e2e8f0",
		"select.item.color.selected": "{color.teal.400}",
	},
	"flat-dropdown": {
		"select.trigger.background": "{surface.inset}",
		"select.trigger.border.color": "{border.divider}",
		"select.trigger.border-radius": "{radius.md}",
		"select.trigger.shadow": "none",
		"select.trigger.color": "#e2e8f0",
		"select.content.background": "{surface.base}",
		"select.content.border.color": "{border.divider}",
		"select.content.border-radius": "{radius.md}",
		"select.content.shadow": "0 2px 8px rgba(0, 0, 0, 0.2)",
		"select.item.background.hover": "{surface.raised}",
		"select.item.color": "#e2e8f0",
		"select.item.color.selected": "#e2e8f0",
	},
} as const;
