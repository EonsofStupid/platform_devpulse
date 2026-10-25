/**
 * @file Skeleton — Seed Style Presets
 * @kind skeleton
 * @package @devpulse/coldlight
 */

export const skeletonPresets = {
	"neuro-pulse": {
		"skeleton.root.background": "{glass.void}",
		"skeleton.root.background.shimmer": "rgba(255, 255, 255, 0.04)",
		"skeleton.root.border-radius": "{radius.md}",
	},
	"flat-pulse": {
		"skeleton.root.background": "{surface.inset}",
		"skeleton.root.background.shimmer": "rgba(255, 255, 255, 0.02)",
		"skeleton.root.border-radius": "{radius.sm}",
	},
} as const;
