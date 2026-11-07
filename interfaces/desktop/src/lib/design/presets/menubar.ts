/**
 * @file Menubar — Seed Style Presets
 * @kind menubar
 * @package @devpulse/coldlight
 */

export const menubarPresets = {
	"neuro-bar": {
		"menubar.root.background": "{glass.deep}",
		"menubar.root.border.color": "{border.strong}",
		"menubar.root.border-radius": "{radius.lg}",
		"menubar.trigger.color": "#e2e8f0",
		"menubar.trigger.background.hover": "{glass.smoke}",
		"menubar.trigger.background.open": "{glass.smoke}",
		"menubar.content.background": "{glass.deep}",
		"menubar.content.border.color": "{border.strong}",
		"menubar.content.border-radius": "{radius.md}",
		"menubar.content.shadow": "0 4px 16px rgba(0, 0, 0, 0.4)",
		"menubar.item.color": "#e2e8f0",
		"menubar.item.background.hover": "{glass.smoke}",
		"menubar.separator.color": "{border.subtle}",
	},
	"flat-bar": {
		"menubar.root.background": "{surface.base}",
		"menubar.root.border.color": "{border.divider}",
		"menubar.root.border-radius": "{radius.md}",
		"menubar.trigger.color": "#e2e8f0",
		"menubar.trigger.background.hover": "{surface.raised}",
		"menubar.trigger.background.open": "{surface.raised}",
		"menubar.content.background": "{surface.base}",
		"menubar.content.border.color": "{border.divider}",
		"menubar.content.border-radius": "{radius.md}",
		"menubar.content.shadow": "0 2px 8px rgba(0, 0, 0, 0.2)",
		"menubar.item.color": "#e2e8f0",
		"menubar.item.background.hover": "{surface.raised}",
		"menubar.separator.color": "{border.divider}",
	},
} as const;
