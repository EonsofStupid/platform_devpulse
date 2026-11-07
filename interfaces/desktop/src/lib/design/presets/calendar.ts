/**
 * @file Calendar — Seed Style Presets
 * @kind calendar
 * @package @devpulse/coldlight
 */

export const calendarPresets = {
	"neuro-grid": {
		"calendar.root.background": "{glass.deep}",
		"calendar.root.border.color": "{border.strong}",
		"calendar.root.border-radius": "{radius.lg}",
		"calendar.header.color": "#e2e8f0",
		"calendar.nav.color": "#94a3b8",
		"calendar.nav.color.hover": "#e2e8f0",
		"calendar.cell.color": "#e2e8f0",
		"calendar.cell.color.outside": "#475569",
		"calendar.cell.background.hover": "{glass.smoke}",
		"calendar.cell.background.selected": "rgba(45, 212, 191, 0.2)",
		"calendar.cell.border-radius": "{radius.md}",
		"calendar.cell.color.today": "{color.teal.400}",
	},
	"flat-grid": {
		"calendar.root.background": "{surface.base}",
		"calendar.root.border.color": "{border.divider}",
		"calendar.root.border-radius": "{radius.md}",
		"calendar.header.color": "#e2e8f0",
		"calendar.nav.color": "#64748b",
		"calendar.nav.color.hover": "#e2e8f0",
		"calendar.cell.color": "#e2e8f0",
		"calendar.cell.color.outside": "#334155",
		"calendar.cell.background.hover": "{surface.raised}",
		"calendar.cell.background.selected": "{surface.inset}",
		"calendar.cell.border-radius": "{radius.sm}",
		"calendar.cell.color.today": "#e2e8f0",
	},
} as const;
