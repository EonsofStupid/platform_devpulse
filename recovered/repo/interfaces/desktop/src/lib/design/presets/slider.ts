/**
 * @file Slider — Seed Style Presets
 * @kind slider
 * @package @devpulse/coldlight
 */

export const sliderPresets = {
	"neuro-track": {
		"slider.track.background": "{glass.void}",
		"slider.track.border-radius": "9999px",
		"slider.track.shadow": "inset 0 1px 3px rgba(0, 0, 0, 0.4)",
		"slider.range.background": "rgba(45, 212, 191, 0.3)",
		"slider.range.shadow": "0 0 4px rgba(45, 212, 191, 0.2)",
		"slider.thumb.background": "{color.teal.400}",
		"slider.thumb.border.color": "#ffffff",
		"slider.thumb.shadow": "0 0 8px rgba(45, 212, 191, 0.4), 0 2px 4px rgba(0, 0, 0, 0.3)",
	},
	"flat-track": {
		"slider.track.background": "{surface.inset}",
		"slider.track.border-radius": "{radius.sm}",
		"slider.track.shadow": "none",
		"slider.range.background": "#94a3b8",
		"slider.range.shadow": "none",
		"slider.thumb.background": "#e2e8f0",
		"slider.thumb.border.color": "{border.divider}",
		"slider.thumb.shadow": "0 1px 2px rgba(0, 0, 0, 0.2)",
	},
} as const;
