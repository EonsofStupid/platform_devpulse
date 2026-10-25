/**
 * @file TableOfContents — Seed Style Presets
 * @kind table-of-contents
 * @package @devpulse/coldlight
 */

export const tableOfContentsPresets = {
	"neuro-sidebar": {
		"table-of-contents.root.border.color": "{border.subtle}",
		"table-of-contents.item.color": "#64748b",
		"table-of-contents.item.color.active": "{color.teal.400}",
		"table-of-contents.item.color.hover": "#e2e8f0",
		"table-of-contents.indicator.color": "{color.teal.400}",
	},
	"flat-sidebar": {
		"table-of-contents.root.border.color": "{border.divider}",
		"table-of-contents.item.color": "#475569",
		"table-of-contents.item.color.active": "#e2e8f0",
		"table-of-contents.item.color.hover": "#94a3b8",
		"table-of-contents.indicator.color": "#e2e8f0",
	},
} as const;
