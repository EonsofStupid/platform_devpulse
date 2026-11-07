/**
 * @file Table + DataTable — Seed Style Presets
 * @kind table, data-table
 * @package @devpulse/coldlight
 */

export const tablePresets = {
	"neuro-grid": {
		"table.root.background": "{glass.deep}",
		"table.root.border.color": "{border.strong}",
		"table.root.border-radius": "{radius.lg}",
		"table.head.background": "{glass.void}",
		"table.head.color": "#94a3b8",
		"table.head.font-weight": "500",
		"table.head.border.color": "{border.subtle}",
		"table.row.background.hover": "{glass.smoke}",
		"table.row.border.color": "{border.subtle}",
		"table.cell.color": "#e2e8f0",
	},
	"flat-striped": {
		"table.root.background": "transparent",
		"table.root.border.color": "{border.divider}",
		"table.root.border-radius": "{radius.md}",
		"table.head.background": "{surface.raised}",
		"table.head.color": "#64748b",
		"table.head.font-weight": "600",
		"table.head.border.color": "{border.divider}",
		"table.row.background.hover": "{surface.raised}",
		"table.row.border.color": "{border.divider}",
		"table.cell.color": "#e2e8f0",
	},
} as const;
