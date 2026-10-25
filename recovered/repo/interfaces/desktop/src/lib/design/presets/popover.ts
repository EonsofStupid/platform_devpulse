/**
 * @file Popover — Seed Style Presets
 * @kind popover
 * @package @devpulse/coldlight
 */

export const popoverPresets = {
	"neuro-float": {
		"popover.content.background": "{glass.deep}",
		"popover.content.border.color": "{border.strong}",
		"popover.content.border-radius": "{radius.lg}",
		"popover.content.shadow": "0 8px 32px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3)",
		"popover.arrow.color": "{glass.deep}",
	},
	"glass-float": {
		"popover.content.background": "{glass.smoke}",
		"popover.content.border.color": "{border.subtle}",
		"popover.content.border-radius": "{radius.lg}",
		"popover.content.shadow": "0 4px 16px rgba(0, 0, 0, 0.3)",
		"popover.arrow.color": "{glass.smoke}",
	},
	"flat-float": {
		"popover.content.background": "{surface.base}",
		"popover.content.border.color": "{border.divider}",
		"popover.content.border-radius": "{radius.md}",
		"popover.content.shadow": "0 2px 8px rgba(0, 0, 0, 0.2)",
		"popover.arrow.color": "{surface.base}",
	},
} as const;
