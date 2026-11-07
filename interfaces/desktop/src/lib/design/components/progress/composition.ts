/**
 * @file Progress Compositions — as const named presets
 * @kind progress
 *
 * Each composition overrides default token values for a visual family.
 * SD5 processes as mode-specific token groups.
 */

export const progressCompositions = {
	"neuro-glow-bar": {
		"progress.track.background": "{glass.void}",
		"progress.fill.background": "#2dd4bf",
		"progress.fill.shadow": "0 0 8px rgba(45, 212, 191, 0.5), 0 0 16px rgba(45, 212, 191, 0.2)",
		"progress.track.shadow": "inset 0 1px 3px rgba(0, 0, 0, 0.4)",
		"progress.track.border-radius": "9999px",
	},
	"flat-thin": {
		"progress.track.background": "{surface.inset}",
		"progress.fill.background": "#94a3b8",
		"progress.fill.shadow": "none",
		"progress.track.shadow": "none",
		"progress.track.border-radius": "{radius.sm}",
	},
	"glass-track": {
		"progress.track.background": "{glass.smoke}",
		"progress.fill.background": "{glass.teal}",
		"progress.fill.shadow": "0 0 6px rgba(45, 212, 191, 0.3)",
		"progress.track.shadow": "0 1px 2px rgba(0, 0, 0, 0.2)",
		"progress.track.border-radius": "9999px",
	},
} as const;
