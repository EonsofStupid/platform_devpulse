/**
 * @file Toggle — Seed Style Presets
 * @kind toggle
 * @package @devpulse/coldlight
 */

export const togglePresets = {
	"neuro-button": {
		"toggle.root.background.off": "{glass.void}",
		"toggle.root.background.on": "rgba(45, 212, 191, 0.15)",
		"toggle.root.border.color.off": "{border.strong}",
		"toggle.root.border.color.on": "{color.teal.400}",
		"toggle.root.border-radius": "{radius.md}",
		"toggle.root.shadow": "inset 0 1px 2px rgba(0, 0, 0, 0.2)",
		"toggle.root.color.off": "#94a3b8",
		"toggle.root.color.on": "{color.teal.400}",
	},
	"flat-button": {
		"toggle.root.background.off": "transparent",
		"toggle.root.background.on": "{surface.inset}",
		"toggle.root.border.color.off": "{border.divider}",
		"toggle.root.border.color.on": "#94a3b8",
		"toggle.root.border-radius": "{radius.sm}",
		"toggle.root.shadow": "none",
		"toggle.root.color.off": "#64748b",
		"toggle.root.color.on": "#e2e8f0",
	},
} as const;
