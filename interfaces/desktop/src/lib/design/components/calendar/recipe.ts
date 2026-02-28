/**
 * @file Calendar Recipe — Shortcode Class Composition
 * @kind compound
 * @layer components
 *
 * GOLD STANDARD recipe — shortcode class composition system.
 *
 * Class strategy:
 *   - Structural classes (calendar-*) handle layout/positioning
 *   - Shortcode classes (v-*, s-*, e-*, sz-*) handle visual appearance
 *   - NO raw Tailwind utilities in recipe output
 */

import { cn } from "$lib/design/utils/cn.js";

type CalendarRecipeProps = { size?: string };

export function calendarRecipe(props: CalendarRecipeProps = {}) {
	const sizeClass = props.size === "sm" ? "sz-sm" : "sz-md";
	return {
		root: cn("calendar-root", "v-void s-glass e-1", sizeClass, "rounded-lg"),
		grid: "calendar-grid",
		header: "calendar-header",
		heading: "calendar-heading",
		cell: cn("calendar-cell", sizeClass),
		headCell: "calendar-headcell",
		nav: "calendar-nav",
		navButton: "calendar-navbtn",
	};
}
