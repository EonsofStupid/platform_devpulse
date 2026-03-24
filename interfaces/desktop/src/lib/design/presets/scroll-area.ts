/**
 * @file ScrollArea — Seed Style Presets
 * @kind scroll-area
 * @package @devpulse/coldlight
 */

export const scrollAreaPresets = {
	"neuro-thin": {
		"scroll-area.scrollbar.background": "transparent",
		"scroll-area.scrollbar.background.hover": "rgba(255, 255, 255, 0.03)",
		"scroll-area.thumb.background": "rgba(255, 255, 255, 0.12)",
		"scroll-area.thumb.background.hover": "rgba(255, 255, 255, 0.2)",
		"scroll-area.thumb.border-radius": "9999px",
	},
	"flat-thin": {
		"scroll-area.scrollbar.background": "transparent",
		"scroll-area.scrollbar.background.hover": "transparent",
		"scroll-area.thumb.background": "rgba(255, 255, 255, 0.08)",
		"scroll-area.thumb.background.hover": "rgba(255, 255, 255, 0.15)",
		"scroll-area.thumb.border-radius": "9999px",
	},
} as const;
