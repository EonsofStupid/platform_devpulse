/**
 * @file RangeCalendar Recipe
 * @kind range-calendar
 * @layer components
 */

import { cn } from "$lib/design/utils/cn.js";

type RangeCalendarRecipeProps = { size?: string };

export function rangeCalendarRecipe(props: RangeCalendarRecipeProps = {}) {
	return {
		root: cn("p-3 v-void s-glass e-1 rounded-lg", props.size === "sm" ? "text-xs" : "text-sm"),
		grid: "w-full border-collapse",
		header: "flex items-center justify-between px-1 py-2",
		heading: "text-sm font-medium",
		cell: cn("relative p-0 text-center", props.size === "sm" ? "h-7 w-7" : "h-9 w-9"),
		headCell: "text-[var(--text-muted)] font-normal text-center",
		navButton: cn(
			"inline-flex items-center justify-center rounded-md",
			"h-7 w-7 hover:bg-[oklch(1_0_0/0.06)]",
			"transition-colors",
		),
	};
}
