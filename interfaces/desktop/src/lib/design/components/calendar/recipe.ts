/**
 * @file Calendar Recipe — Structural Classes Only
 * @kind compound
 * @layer components
 *
 * Visual appearance (surface, depth, glow, etc.) flows through
 * useColdLight() → resolveVisual(). Recipe provides ONLY structural layout.
 *
 * NO hardcoded v-encoding classes. NO legacy shortcodes.
 */

import { cn } from "$lib/design/utils/cn.js";

type CalendarRecipeProps = { size?: string };

export function calendarRecipe(props: CalendarRecipeProps = {}) {
	const sizeClass = props.size === "sm" ? "p-3 text-sm" : "p-4 text-sm";
	const cellSize = props.size === "sm" ? "text-xs" : "text-sm";
	return {
		root: cn("calendar-root", sizeClass, "rounded-lg"),
		grid: "calendar-grid",
		header: "calendar-header",
		heading: "calendar-heading",
		cell: cn("calendar-cell", cellSize),
		headCell: "calendar-headcell",
		nav: "calendar-nav",
		navButton: "calendar-navbtn",
	};
}
