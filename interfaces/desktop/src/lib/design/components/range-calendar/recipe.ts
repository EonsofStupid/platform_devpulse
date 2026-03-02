/**
 * @file RangeCalendar Recipe — Structural Classes Only
 * @kind range-calendar
 * @layer components
 *
 * Visual appearance (surface, depth, glow, etc.) flows through
 * useColdLight() → resolveVisual(). Recipe provides ONLY structural layout.
 *
 * NO hardcoded v-encoding classes. NO legacy shortcodes.
 */

import { cn } from "$lib/design/utils/cn.js";

type RangeCalendarRecipeProps = { size?: string };

export function rangeCalendarRecipe(props: RangeCalendarRecipeProps = {}) {
	const size = props.size ?? "md";
	const rootSize: Record<string, string> = {
		sm: "p-3 text-sm",
		md: "p-4 text-sm",
		lg: "p-6 text-base",
	};
	const cellSize: Record<string, string> = {
		sm: "text-xs",
		md: "text-sm",
		lg: "text-base",
	};
	return {
		root: cn(
			"range-calendar-root",
			rootSize[size] ?? rootSize.md,
			"rounded-lg",
		),
		grid: "range-calendar-grid",
		header: "range-calendar-header",
		heading: "range-calendar-heading",
		cell: cn("range-calendar-cell", cellSize[size] ?? cellSize.md),
		headCell: "range-calendar-headcell",
		navButton: "range-calendar-nav",
	};
}
