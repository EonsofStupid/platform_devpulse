/**
 * @file ColorArea — Seed Style Presets
 * @kind color-area
 * @package @devpulse/coldlight
 */

export const colorAreaPresets = {
	"neuro-picker": {
		"color-area.root.border.color": "{border.strong}",
		"color-area.root.border-radius": "{radius.lg}",
		"color-area.root.shadow": "inset 0 1px 3px rgba(0, 0, 0, 0.4)",
		"color-area.thumb.border.color": "#ffffff",
		"color-area.thumb.shadow": "0 0 4px rgba(0, 0, 0, 0.5)",
	},
	"flat-picker": {
		"color-area.root.border.color": "{border.divider}",
		"color-area.root.border-radius": "{radius.md}",
		"color-area.root.shadow": "none",
		"color-area.thumb.border.color": "#ffffff",
		"color-area.thumb.shadow": "0 0 2px rgba(0, 0, 0, 0.3)",
	},
} as const;
