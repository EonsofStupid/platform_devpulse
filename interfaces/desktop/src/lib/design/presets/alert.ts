/**
 * @file Alert — Seed Style Presets
 * @kind alert
 * @package @devpulse/coldlight
 */

export const alertPresets = {
	"neuro-info": {
		"alert.root.background": "rgba(0, 200, 200, 0.08)",
		"alert.root.border.color": "rgba(0, 200, 200, 0.3)",
		"alert.root.border-radius": "{radius.lg}",
		"alert.root.color": "#e0f7fa",
		"alert.icon.color": "{color.teal.400}",
	},
	"neuro-success": {
		"alert.root.background": "rgba(34, 197, 94, 0.08)",
		"alert.root.border.color": "rgba(34, 197, 94, 0.3)",
		"alert.root.border-radius": "{radius.lg}",
		"alert.root.color": "#dcfce7",
		"alert.icon.color": "#22c55e",
	},
	"neuro-warning": {
		"alert.root.background": "rgba(234, 179, 8, 0.08)",
		"alert.root.border.color": "rgba(234, 179, 8, 0.3)",
		"alert.root.border-radius": "{radius.lg}",
		"alert.root.color": "#fef9c3",
		"alert.icon.color": "#eab308",
	},
	"neuro-error": {
		"alert.root.background": "rgba(239, 68, 68, 0.08)",
		"alert.root.border.color": "rgba(239, 68, 68, 0.3)",
		"alert.root.border-radius": "{radius.lg}",
		"alert.root.color": "#fecaca",
		"alert.icon.color": "#ef4444",
	},
	"flat-info": {
		"alert.root.background": "{surface.inset}",
		"alert.root.border.color": "{border.divider}",
		"alert.root.border-radius": "{radius.md}",
		"alert.root.color": "#e2e8f0",
		"alert.icon.color": "#94a3b8",
	},
} as const;
