/**
 * @file Spinner — Seed Style Presets
 * @kind spinner
 * @package @devpulse/coldlight
 */

export const spinnerPresets = {
	"neuro-glow": {
		"spinner.root.color": "{color.teal.400}",
		"spinner.root.animation": "spin 0.8s linear infinite",
		"spinner.root.glow-color": "rgba(45, 212, 191, 0.3)",
		"spinner.root.glow-radius": "8px",
	},
	"flat-spin": {
		"spinner.root.color": "#94a3b8",
		"spinner.root.animation": "spin 1s linear infinite",
		"spinner.root.glow-radius": "0px",
	},
} as const;
