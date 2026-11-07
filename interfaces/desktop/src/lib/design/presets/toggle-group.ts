/**
 * @file ToggleGroup — Seed Style Presets
 * @kind toggle-group
 * @package @devpulse/coldlight
 */

export const toggleGroupPresets = {
	"neuro-segmented": {
		"toggle-group.root.background": "{glass.void}",
		"toggle-group.root.border.color": "{border.strong}",
		"toggle-group.root.border-radius": "{radius.lg}",
		"toggle-group.item.background.off": "transparent",
		"toggle-group.item.background.on": "{glass.deep}",
		"toggle-group.item.color.off": "#94a3b8",
		"toggle-group.item.color.on": "#e2e8f0",
		"toggle-group.item.border-radius": "{radius.md}",
	},
	"flat-segmented": {
		"toggle-group.root.background": "{surface.inset}",
		"toggle-group.root.border.color": "{border.divider}",
		"toggle-group.root.border-radius": "{radius.md}",
		"toggle-group.item.background.off": "transparent",
		"toggle-group.item.background.on": "{surface.base}",
		"toggle-group.item.color.off": "#64748b",
		"toggle-group.item.color.on": "#e2e8f0",
		"toggle-group.item.border-radius": "{radius.sm}",
	},
} as const;
