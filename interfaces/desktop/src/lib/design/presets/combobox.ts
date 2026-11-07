/**
 * @file Combobox — Seed Style Presets
 * @kind combobox
 * @package @devpulse/coldlight
 */

export const comboboxPresets = {
	"neuro-inset": {
		"combobox.input.background": "{glass.void}",
		"combobox.input.border.color": "{border.strong}",
		"combobox.input.border-radius": "{radius.lg}",
		"combobox.input.shadow": "inset 0 1px 2px rgba(0, 0, 0, 0.3)",
		"combobox.input.color": "#e2e8f0",
		"combobox.content.background": "{glass.deep}",
		"combobox.content.border.color": "{border.strong}",
		"combobox.content.border-radius": "{radius.lg}",
		"combobox.content.shadow": "0 4px 16px rgba(0, 0, 0, 0.4)",
		"combobox.item.background.hover": "{glass.smoke}",
		"combobox.item.color": "#e2e8f0",
	},
	"flat-dropdown": {
		"combobox.input.background": "{surface.inset}",
		"combobox.input.border.color": "{border.divider}",
		"combobox.input.border-radius": "{radius.md}",
		"combobox.input.shadow": "none",
		"combobox.input.color": "#e2e8f0",
		"combobox.content.background": "{surface.base}",
		"combobox.content.border.color": "{border.divider}",
		"combobox.content.border-radius": "{radius.md}",
		"combobox.content.shadow": "0 2px 8px rgba(0, 0, 0, 0.2)",
		"combobox.item.background.hover": "{surface.raised}",
		"combobox.item.color": "#e2e8f0",
	},
} as const;
