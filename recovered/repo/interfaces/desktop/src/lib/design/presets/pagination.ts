/**
 * @file Pagination — Seed Style Presets
 * @kind pagination
 * @package @devpulse/coldlight
 */

export const paginationPresets = {
	"neuro-pills": {
		"pagination.page.background": "{glass.void}",
		"pagination.page.background.hover": "{glass.smoke}",
		"pagination.page.background.active": "rgba(45, 212, 191, 0.15)",
		"pagination.page.border.color": "{border.strong}",
		"pagination.page.border-radius": "{radius.md}",
		"pagination.page.color": "#94a3b8",
		"pagination.page.color.active": "{color.teal.400}",
		"pagination.nav.color": "#64748b",
		"pagination.nav.color.hover": "#e2e8f0",
	},
	"flat-numbered": {
		"pagination.page.background": "transparent",
		"pagination.page.background.hover": "{surface.raised}",
		"pagination.page.background.active": "{surface.inset}",
		"pagination.page.border.color": "transparent",
		"pagination.page.border-radius": "{radius.sm}",
		"pagination.page.color": "#64748b",
		"pagination.page.color.active": "#e2e8f0",
		"pagination.nav.color": "#475569",
		"pagination.nav.color.hover": "#e2e8f0",
	},
} as const;
