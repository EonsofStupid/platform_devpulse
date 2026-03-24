/**
 * @file Collapsible — Seed Style Presets
 * @kind collapsible
 * @package @devpulse/coldlight
 */

export const collapsiblePresets = {
	"neuro-panel": {
		"collapsible.root.background": "{glass.deep}",
		"collapsible.root.border.color": "{border.strong}",
		"collapsible.root.border-radius": "{radius.lg}",
		"collapsible.trigger.color": "#e2e8f0",
		"collapsible.trigger.background.hover": "{glass.smoke}",
		"collapsible.content.background": "{glass.void}",
	},
	"flat-section": {
		"collapsible.root.background": "transparent",
		"collapsible.root.border.color": "{border.divider}",
		"collapsible.root.border-radius": "0px",
		"collapsible.trigger.color": "#e2e8f0",
		"collapsible.trigger.background.hover": "{surface.raised}",
		"collapsible.content.background": "transparent",
	},
} as const;
