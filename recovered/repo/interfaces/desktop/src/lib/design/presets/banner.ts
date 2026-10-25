/**
 * @file Banner — Seed Style Presets
 * @kind banner
 * @package @devpulse/coldlight
 */

export const bannerPresets = {
	"neuro-bar": {
		"banner.root.background": "{glass.deep}",
		"banner.root.border.color": "{border.strong}",
		"banner.root.shadow": "0 2px 8px rgba(0, 0, 0, 0.4)",
		"banner.root.color": "#e2e8f0",
		"banner.dismiss.color": "#94a3b8",
		"banner.dismiss.color.hover": "#e2e8f0",
	},
	"glass-strip": {
		"banner.root.background": "{glass.smoke}",
		"banner.root.border.color": "{border.subtle}",
		"banner.root.shadow": "0 1px 4px rgba(0, 0, 0, 0.2)",
		"banner.root.color": "#e2e8f0",
		"banner.dismiss.color": "#64748b",
		"banner.dismiss.color.hover": "#e2e8f0",
	},
	"flat-strip": {
		"banner.root.background": "{surface.raised}",
		"banner.root.border.color": "{border.divider}",
		"banner.root.shadow": "none",
		"banner.root.color": "#e2e8f0",
		"banner.dismiss.color": "#64748b",
		"banner.dismiss.color.hover": "#e2e8f0",
	},
} as const;
