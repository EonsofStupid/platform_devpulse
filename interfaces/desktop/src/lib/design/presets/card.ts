/**
 * @file Card — Seed Style Presets
 * @kind card
 * @package @devpulse/coldlight
 */

export const cardPresets = {
	"neuro-elevated": {
		"card.root.background": "{glass.deep}",
		"card.root.border.color": "{border.strong}",
		"card.root.border-radius": "{radius.lg}",
		"card.root.shadow": "0 4px 16px rgba(0, 0, 0, 0.4), 0 1px 4px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.06), inset 0 -1px 0 rgba(0, 0, 0, 0.1)",
	},
	"glass-panel": {
		"card.root.background": "{glass.smoke}",
		"card.root.border.color": "{border.subtle}",
		"card.root.border-radius": "{radius.lg}",
		"card.root.shadow": "0 2px 8px rgba(0, 0, 0, 0.2)",
	},
	"flat-outlined": {
		"card.root.background": "{surface.base}",
		"card.root.border.color": "{border.divider}",
		"card.root.border-radius": "{radius.md}",
		"card.root.shadow": "{shadow.z0}",
	},
	"matte-solid": {
		"card.root.background": "{matte.dark}",
		"card.root.border.color": "{border.subtle}",
		"card.root.border-radius": "{radius.md}",
		"card.root.shadow": "0 1px 3px rgba(0, 0, 0, 0.3)",
	},
} as const;
