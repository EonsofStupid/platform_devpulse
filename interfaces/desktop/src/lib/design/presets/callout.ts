/**
 * @file Callout — Seed Style Presets
 * @kind callout
 * @package @devpulse/coldlight
 */

export const calloutPresets = {
	"neuro-info": {
		"callout.root.background": "rgba(0, 200, 200, 0.06)",
		"callout.root.border.color": "rgba(0, 200, 200, 0.2)",
		"callout.root.border-radius": "{radius.lg}",
		"callout.root.border.width": "1px 1px 1px 4px",
		"callout.root.color": "#e0f7fa",
		"callout.icon.color": "{color.teal.400}",
	},
	"neuro-warning": {
		"callout.root.background": "rgba(234, 179, 8, 0.06)",
		"callout.root.border.color": "rgba(234, 179, 8, 0.2)",
		"callout.root.border-radius": "{radius.lg}",
		"callout.root.border.width": "1px 1px 1px 4px",
		"callout.root.color": "#fef9c3",
		"callout.icon.color": "#eab308",
	},
	"neuro-error": {
		"callout.root.background": "rgba(239, 68, 68, 0.06)",
		"callout.root.border.color": "rgba(239, 68, 68, 0.2)",
		"callout.root.border-radius": "{radius.lg}",
		"callout.root.border.width": "1px 1px 1px 4px",
		"callout.root.color": "#fecaca",
		"callout.icon.color": "#ef4444",
	},
	"flat-neutral": {
		"callout.root.background": "{surface.inset}",
		"callout.root.border.color": "{border.divider}",
		"callout.root.border-radius": "{radius.md}",
		"callout.root.border.width": "1px",
		"callout.root.color": "#e2e8f0",
		"callout.icon.color": "#94a3b8",
	},
} as const;
