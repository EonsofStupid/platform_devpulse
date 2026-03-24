/**
 * @file NavigationMenu — Seed Style Presets
 * @kind navigation-menu
 * @package @devpulse/coldlight
 */

export const navigationMenuPresets = {
	"neuro-dropdown": {
		"navigation-menu.trigger.color": "#e2e8f0",
		"navigation-menu.trigger.background.hover": "{glass.smoke}",
		"navigation-menu.content.background": "{glass.deep}",
		"navigation-menu.content.border.color": "{border.strong}",
		"navigation-menu.content.border-radius": "{radius.lg}",
		"navigation-menu.content.shadow": "0 8px 32px rgba(0, 0, 0, 0.5)",
		"navigation-menu.link.color": "#94a3b8",
		"navigation-menu.link.color.hover": "#e2e8f0",
		"navigation-menu.link.background.hover": "{glass.smoke}",
	},
	"flat-dropdown": {
		"navigation-menu.trigger.color": "#e2e8f0",
		"navigation-menu.trigger.background.hover": "{surface.raised}",
		"navigation-menu.content.background": "{surface.base}",
		"navigation-menu.content.border.color": "{border.divider}",
		"navigation-menu.content.border-radius": "{radius.md}",
		"navigation-menu.content.shadow": "0 4px 12px rgba(0, 0, 0, 0.2)",
		"navigation-menu.link.color": "#64748b",
		"navigation-menu.link.color.hover": "#e2e8f0",
		"navigation-menu.link.background.hover": "{surface.raised}",
	},
} as const;
