/**
 * @file Accordion — Seed Style Presets
 * @kind accordion
 * @package @devpulse/coldlight
 */

export const accordionPresets = {
	"neuro-elevated": {
		"accordion.root.background": "{glass.deep}",
		"accordion.root.border.color": "{border.strong}",
		"accordion.root.border-radius": "{radius.lg}",
		"accordion.item.border.color": "{border.subtle}",
		"accordion.trigger.background.hover": "{glass.smoke}",
		"accordion.trigger.color": "#e2e8f0",
		"accordion.content.background": "{glass.void}",
		"accordion.indicator.color": "{color.teal.400}",
	},
	"glass-panel": {
		"accordion.root.background": "{glass.smoke}",
		"accordion.root.border.color": "{border.subtle}",
		"accordion.root.border-radius": "{radius.md}",
		"accordion.item.border.color": "{border.divider}",
		"accordion.trigger.background.hover": "rgba(255, 255, 255, 0.04)",
		"accordion.trigger.color": "#e2e8f0",
		"accordion.content.background": "transparent",
		"accordion.indicator.color": "#94a3b8",
	},
	"flat-minimal": {
		"accordion.root.background": "transparent",
		"accordion.root.border.color": "transparent",
		"accordion.root.border-radius": "0px",
		"accordion.item.border.color": "{border.divider}",
		"accordion.trigger.background.hover": "{surface.raised}",
		"accordion.trigger.color": "#e2e8f0",
		"accordion.content.background": "transparent",
		"accordion.indicator.color": "#64748b",
	},
} as const;
