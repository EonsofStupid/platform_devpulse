/**
 * @file RangeCalendar Recipe — Shortcode Composition
 * @kind range-calendar
 * @layer components
 *
 * GOLD STANDARD — structural classes + shortcode composition only.
 * NO raw Tailwind utilities in recipe output.
 *
 * Structural classes (range-calendar-*) handle layout/positioning.
 * Root receives v-* s-* e-* for glass treatment.
 * Size via sz-* sets --recipe-font-size and --recipe-min-h for cells.
 */

import { cn } from "$lib/design/utils/cn.js";

type RangeCalendarRecipeProps = { size?: string };

export function rangeCalendarRecipe(props: RangeCalendarRecipeProps = {}) {
	const size = props.size ?? "md";
	return {
		root: cn(
			"range-calendar-root",
			"v-s1 v-d1",
			`sz-${size}`,
			"rounded-lg",
		),
		grid: "range-calendar-grid",
		header: "range-calendar-header",
		heading: "range-calendar-heading",
		cell: cn("range-calendar-cell", `sz-${size}`),
		headCell: "range-calendar-headcell",
		navButton: "range-calendar-nav",
	};
}
