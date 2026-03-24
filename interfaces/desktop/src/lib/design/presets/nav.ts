/**
 * @file Nav — Seed Style Presets
 * @kind nav
 * @package @devpulse/coldlight
 */

export const navPresets = {
	"neuro-sidebar": {
		"nav.root.background": "{glass.deep}",
		"nav.root.border.color": "{border.strong}",
		"nav.item.color": "#94a3b8",
		"nav.item.color.active": "#e2e8f0",
		"nav.item.background.hover": "{glass.smoke}",
		"nav.item.background.active": "rgba(45, 212, 191, 0.1)",
		"nav.item.indicator.color": "{color.teal.400}",
		"nav.item.border-radius": "{radius.md}",
	},
	"flat-tabs": {
		"nav.root.background": "transparent",
		"nav.root.border.color": "{border.divider}",
		"nav.item.color": "#64748b",
		"nav.item.color.active": "#e2e8f0",
		"nav.item.background.hover": "{surface.raised}",
		"nav.item.background.active": "transparent",
		"nav.item.indicator.color": "#e2e8f0",
		"nav.item.border-radius": "{radius.sm}",
	},
} as const;
