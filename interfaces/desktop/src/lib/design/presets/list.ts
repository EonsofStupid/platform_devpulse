/**
 * @file List — Seed Style Presets
 * @kind list
 * @package @devpulse/coldlight
 */

export const listPresets = {
	"neuro-bordered": {
		"list.root.border.color": "{border.strong}",
		"list.root.border-radius": "{radius.lg}",
		"list.item.border.color": "{border.subtle}",
		"list.item.background.hover": "{glass.smoke}",
		"list.item.color": "#e2e8f0",
		"list.item.color.secondary": "#94a3b8",
	},
	"flat-divided": {
		"list.root.border.color": "transparent",
		"list.root.border-radius": "0px",
		"list.item.border.color": "{border.divider}",
		"list.item.background.hover": "{surface.raised}",
		"list.item.color": "#e2e8f0",
		"list.item.color.secondary": "#64748b",
	},
} as const;
