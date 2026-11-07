/**
 * @file RangeCalendar — Seed Style Presets
 * @kind range-calendar
 * @package @devpulse/coldlight
 */

export const rangeCalendarPresets = {
	"neuro-grid": {
		"range-calendar.root.background": "{glass.deep}",
		"range-calendar.root.border.color": "{border.strong}",
		"range-calendar.root.border-radius": "{radius.lg}",
		"range-calendar.cell.color": "#e2e8f0",
		"range-calendar.cell.background.hover": "{glass.smoke}",
		"range-calendar.cell.background.selected": "rgba(45, 212, 191, 0.15)",
		"range-calendar.cell.background.range": "rgba(45, 212, 191, 0.06)",
		"range-calendar.cell.border-radius": "{radius.md}",
		"range-calendar.cell.color.outside": "#475569",
	},
	"flat-grid": {
		"range-calendar.root.background": "{surface.base}",
		"range-calendar.root.border.color": "{border.divider}",
		"range-calendar.root.border-radius": "{radius.md}",
		"range-calendar.cell.color": "#e2e8f0",
		"range-calendar.cell.background.hover": "{surface.raised}",
		"range-calendar.cell.background.selected": "{surface.inset}",
		"range-calendar.cell.background.range": "rgba(148, 163, 184, 0.06)",
		"range-calendar.cell.border-radius": "{radius.sm}",
		"range-calendar.cell.color.outside": "#334155",
	},
} as const;
