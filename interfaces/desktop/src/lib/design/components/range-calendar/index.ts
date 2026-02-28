/**
 * @file RangeCalendar Component Barrel
 * @kind range-calendar
 * @layer components
 *
 * Compound component: exports root + all sub-components.
 */

export { default as RangeCalendar } from "./RangeCalendar.svelte";
export { default as RangeCalendarHeader } from "./RangeCalendarHeader.svelte";
export { default as RangeCalendarGrid } from "./RangeCalendarGrid.svelte";
export { default as RangeCalendarCell } from "./RangeCalendarCell.svelte";

export { contract as rangeCalendarComponentContract } from "./contract.js";
export { rangeCalendarRecipe } from "./recipe.js";
export { setRangeCalendarContext, getRangeCalendarContext } from "./context.js";

export type { RangeCalendarContext } from "./context.js";
export type {
	RangeCalendarProps,
	RangeCalendarHeaderProps,
	RangeCalendarGridProps,
	RangeCalendarCellProps,
	DateRange,
	Size as RangeCalendarSize,
} from "./types.js";
