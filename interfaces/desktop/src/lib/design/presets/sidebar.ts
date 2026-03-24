/**
 * @file Sidebar — Seed Style Presets
 * @kind sidebar
 * @package @devpulse/coldlight
 */

export const sidebarPresets = {
	"neuro-panel": {
		"sidebar.root.background": "{glass.deep}",
		"sidebar.root.border.color": "{border.strong}",
		"sidebar.root.shadow": "2px 0 8px rgba(0, 0, 0, 0.3)",
		"sidebar.header.border.color": "{border.subtle}",
		"sidebar.footer.border.color": "{border.subtle}",
	},
	"flat-panel": {
		"sidebar.root.background": "{surface.base}",
		"sidebar.root.border.color": "{border.divider}",
		"sidebar.root.shadow": "none",
		"sidebar.header.border.color": "{border.divider}",
		"sidebar.footer.border.color": "{border.divider}",
	},
} as const;
