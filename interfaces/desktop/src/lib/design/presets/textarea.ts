/**
 * @file Textarea — Seed Style Presets
 * @kind textarea
 * @package @devpulse/coldlight
 */

export const textareaPresets = {
	"neuro-inset": {
		"textarea.root.background": "{glass.void}",
		"textarea.root.background.focus": "{glass.deep}",
		"textarea.root.border.color": "{border.strong}",
		"textarea.root.border-radius": "{radius.lg}",
		"textarea.root.shadow": "inset 0 2px 4px rgba(0, 0, 0, 0.3)",
		"textarea.root.shadow.focus": "inset 0 2px 4px rgba(0, 0, 0, 0.3), 0 0 0 3px rgba(45, 212, 191, 0.2)",
		"textarea.root.color": "#e2e8f0",
	},
	"flat-bordered": {
		"textarea.root.background": "{surface.inset}",
		"textarea.root.background.focus": "{surface.inset}",
		"textarea.root.border.color": "{border.divider}",
		"textarea.root.border-radius": "{radius.md}",
		"textarea.root.shadow": "none",
		"textarea.root.shadow.focus": "0 0 0 2px #94a3b8",
		"textarea.root.color": "#e2e8f0",
	},
} as const;
