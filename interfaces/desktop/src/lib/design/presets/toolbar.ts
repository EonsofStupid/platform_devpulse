/**
 * @file Toolbar — Seed Style Presets
 * @kind toolbar
 * @package @devpulse/coldlight
 */

export const toolbarPresets = {
	"neuro-bar": {
		"toolbar.root.background": "{glass.deep}",
		"toolbar.root.border.color": "{border.strong}",
		"toolbar.root.border-radius": "{radius.lg}",
		"toolbar.root.shadow": "0 1px 3px rgba(0, 0, 0, 0.3)",
		"toolbar.separator.color": "{border.subtle}",
	},
	"flat-bar": {
		"toolbar.root.background": "{surface.base}",
		"toolbar.root.border.color": "{border.divider}",
		"toolbar.root.border-radius": "{radius.md}",
		"toolbar.root.shadow": "none",
		"toolbar.separator.color": "{border.divider}",
	},
} as const;
