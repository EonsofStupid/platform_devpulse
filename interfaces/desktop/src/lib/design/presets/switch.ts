/**
 * @file Switch — Seed Style Presets
 * @kind switch
 * @package @devpulse/coldlight
 */

export const switchPresets = {
	"neuro-toggle": {
		"switch.track.background.off": "{glass.void}",
		"switch.track.background.on": "rgba(45, 212, 191, 0.3)",
		"switch.track.border.color": "{border.strong}",
		"switch.track.shadow": "inset 0 1px 3px rgba(0, 0, 0, 0.4)",
		"switch.thumb.background": "#e2e8f0",
		"switch.thumb.shadow": "0 1px 3px rgba(0, 0, 0, 0.3)",
		"switch.thumb.shadow.on": "0 0 6px rgba(45, 212, 191, 0.4), 0 1px 3px rgba(0, 0, 0, 0.3)",
	},
	"flat-toggle": {
		"switch.track.background.off": "{surface.inset}",
		"switch.track.background.on": "#94a3b8",
		"switch.track.border.color": "{border.divider}",
		"switch.track.shadow": "none",
		"switch.thumb.background": "#ffffff",
		"switch.thumb.shadow": "0 1px 2px rgba(0, 0, 0, 0.2)",
		"switch.thumb.shadow.on": "0 1px 2px rgba(0, 0, 0, 0.2)",
	},
} as const;
