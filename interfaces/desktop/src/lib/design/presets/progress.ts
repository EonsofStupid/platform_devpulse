/**
 * @file Progress — Seed Style Presets
 * @kind progress
 * @package @devpulse/coldlight
 *
 * Ref: DASHBOARD-REFERENCE-01.png (circular gauge with glow, linear bars)
 */

export const progressPresets = {
	"neuro-glow-bar": {
		"progress.track.background": "rgba(5, 8, 15, 0.7)",
		"progress.track.border-radius": "9999px",
		"progress.track.shadow": "inset 0 2px 4px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(0, 0, 0, 0.3)",
		"progress.fill.background": "linear-gradient(90deg, rgba(0, 200, 200, 0.6) 0%, #00c8c8 100%)",
		"progress.fill.shadow": "0 0 8px rgba(0, 200, 200, 0.5), 0 0 16px rgba(0, 200, 200, 0.2), 0 0 32px rgba(0, 200, 200, 0.08)",
		"progress.fill.border-radius": "9999px",
	},
	"neuro-glow-purple": {
		"progress.track.background": "rgba(5, 8, 15, 0.7)",
		"progress.track.border-radius": "9999px",
		"progress.track.shadow": "inset 0 2px 4px rgba(0, 0, 0, 0.5)",
		"progress.fill.background": "linear-gradient(90deg, rgba(167, 139, 250, 0.6) 0%, #a78bfa 100%)",
		"progress.fill.shadow": "0 0 8px rgba(167, 139, 250, 0.5), 0 0 16px rgba(167, 139, 250, 0.2)",
		"progress.fill.border-radius": "9999px",
	},
	"neuro-glow-amber": {
		"progress.track.background": "rgba(5, 8, 15, 0.7)",
		"progress.track.border-radius": "9999px",
		"progress.track.shadow": "inset 0 2px 4px rgba(0, 0, 0, 0.5)",
		"progress.fill.background": "linear-gradient(90deg, rgba(245, 158, 11, 0.6) 0%, #f59e0b 100%)",
		"progress.fill.shadow": "0 0 8px rgba(245, 158, 11, 0.5), 0 0 16px rgba(245, 158, 11, 0.2)",
		"progress.fill.border-radius": "9999px",
	},
	"glass-track": {
		"progress.track.background": "rgba(255, 255, 255, 0.04)",
		"progress.track.border-radius": "9999px",
		"progress.track.shadow": "0 1px 2px rgba(0, 0, 0, 0.2)",
		"progress.fill.background": "rgba(0, 200, 200, 0.4)",
		"progress.fill.shadow": "0 0 6px rgba(0, 200, 200, 0.3)",
		"progress.fill.border-radius": "9999px",
	},
	"flat-thin": {
		"progress.track.background": "rgba(255, 255, 255, 0.04)",
		"progress.track.border-radius": "4px",
		"progress.track.shadow": "none",
		"progress.fill.background": "#94a3b8",
		"progress.fill.shadow": "none",
		"progress.fill.border-radius": "4px",
	},
} as const;
