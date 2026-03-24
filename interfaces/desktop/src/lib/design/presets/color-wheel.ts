/**
 * @file ColorWheel — Seed Style Presets
 * @kind color-wheel
 * @package @devpulse/coldlight
 */

export const colorWheelPresets = {
	"neuro-ring": {
		"color-wheel.track.border.color": "{border.strong}",
		"color-wheel.track.shadow": "0 2px 8px rgba(0, 0, 0, 0.4), inset 0 1px 2px rgba(0, 0, 0, 0.3)",
		"color-wheel.thumb.border.color": "#ffffff",
		"color-wheel.thumb.shadow": "0 0 4px rgba(0, 0, 0, 0.5)",
	},
	"flat-ring": {
		"color-wheel.track.border.color": "{border.divider}",
		"color-wheel.track.shadow": "none",
		"color-wheel.thumb.border.color": "#ffffff",
		"color-wheel.thumb.shadow": "0 0 2px rgba(0, 0, 0, 0.3)",
	},
} as const;
