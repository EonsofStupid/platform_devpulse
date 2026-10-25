/**
 * @file InlineMessage — Seed Style Presets
 * @kind inline-message
 * @package @devpulse/coldlight
 */

export const inlineMessagePresets = {
	"neuro-info": {
		"inline-message.root.background": "rgba(0, 200, 200, 0.06)",
		"inline-message.root.border.color": "rgba(0, 200, 200, 0.15)",
		"inline-message.root.border-radius": "{radius.md}",
		"inline-message.root.color": "#e0f7fa",
		"inline-message.icon.color": "{color.teal.400}",
	},
	"neuro-error": {
		"inline-message.root.background": "rgba(239, 68, 68, 0.06)",
		"inline-message.root.border.color": "rgba(239, 68, 68, 0.15)",
		"inline-message.root.border-radius": "{radius.md}",
		"inline-message.root.color": "#fecaca",
		"inline-message.icon.color": "#ef4444",
	},
	"flat-neutral": {
		"inline-message.root.background": "{surface.inset}",
		"inline-message.root.border.color": "{border.divider}",
		"inline-message.root.border-radius": "{radius.sm}",
		"inline-message.root.color": "#e2e8f0",
		"inline-message.icon.color": "#94a3b8",
	},
} as const;
