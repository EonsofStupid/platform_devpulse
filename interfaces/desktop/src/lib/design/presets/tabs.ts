/**
 * @file Tabs — Seed Style Presets
 * @kind tabs
 * @package @devpulse/coldlight
 */

export const tabsPresets = {
	"neuro-bar": {
		"tabs.list.background": "{glass.deep}",
		"tabs.list.border.color": "{border.strong}",
		"tabs.list.border-radius": "{radius.lg}",
		"tabs.trigger.color": "#94a3b8",
		"tabs.trigger.color.active": "#e2e8f0",
		"tabs.trigger.background.hover": "{glass.smoke}",
		"tabs.trigger.background.active": "rgba(45, 212, 191, 0.1)",
		"tabs.trigger.indicator.color": "{color.teal.400}",
		"tabs.content.color": "#e2e8f0",
	},
	"flat-underline": {
		"tabs.list.background": "transparent",
		"tabs.list.border.color": "{border.divider}",
		"tabs.list.border-radius": "0px",
		"tabs.trigger.color": "#64748b",
		"tabs.trigger.color.active": "#e2e8f0",
		"tabs.trigger.background.hover": "transparent",
		"tabs.trigger.background.active": "transparent",
		"tabs.trigger.indicator.color": "#e2e8f0",
		"tabs.content.color": "#e2e8f0",
	},
} as const;
