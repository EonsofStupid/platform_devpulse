/**
 * @file ColorSlider — Seed Style Presets
 * @kind color-slider
 * @package @devpulse/coldlight
 */

export const colorSliderPresets = {
	"neuro-track": {
		"color-slider.track.border.color": "{border.strong}",
		"color-slider.track.border-radius": "9999px",
		"color-slider.track.shadow": "inset 0 1px 2px rgba(0, 0, 0, 0.3)",
		"color-slider.thumb.border.color": "#ffffff",
		"color-slider.thumb.shadow": "0 0 4px rgba(0, 0, 0, 0.5)",
	},
	"flat-track": {
		"color-slider.track.border.color": "{border.divider}",
		"color-slider.track.border-radius": "{radius.sm}",
		"color-slider.track.shadow": "none",
		"color-slider.thumb.border.color": "#ffffff",
		"color-slider.thumb.shadow": "0 0 2px rgba(0, 0, 0, 0.3)",
	},
} as const;
