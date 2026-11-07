/**
 * @file InputGroup — Seed Style Presets
 * @kind input-group
 * @package @devpulse/coldlight
 */

export const inputGroupPresets = {
	"neuro-inset": {
		"input-group.root.background": "{glass.void}",
		"input-group.root.border.color": "{border.strong}",
		"input-group.root.border-radius": "{radius.lg}",
		"input-group.root.shadow": "inset 0 1px 2px rgba(0, 0, 0, 0.3)",
		"input-group.prefix.color": "#64748b",
		"input-group.suffix.color": "#64748b",
		"input-group.input.color": "#e2e8f0",
	},
	"flat-bordered": {
		"input-group.root.background": "{surface.inset}",
		"input-group.root.border.color": "{border.divider}",
		"input-group.root.border-radius": "{radius.md}",
		"input-group.root.shadow": "none",
		"input-group.prefix.color": "#475569",
		"input-group.suffix.color": "#475569",
		"input-group.input.color": "#e2e8f0",
	},
} as const;
