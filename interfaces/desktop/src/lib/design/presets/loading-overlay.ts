/**
 * @file LoadingOverlay — Seed Style Presets
 * @kind loading-overlay
 * @package @devpulse/coldlight
 */

export const loadingOverlayPresets = {
	"neuro-blur": {
		"loading-overlay.root.background": "rgba(0, 0, 0, 0.5)",
		"loading-overlay.root.backdrop-blur": "4px",
		"loading-overlay.spinner.color": "{color.teal.400}",
	},
	"flat-dim": {
		"loading-overlay.root.background": "rgba(0, 0, 0, 0.3)",
		"loading-overlay.root.backdrop-blur": "0px",
		"loading-overlay.spinner.color": "#94a3b8",
	},
} as const;
