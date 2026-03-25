/**
 * @file RangeCalendar Component Barrel
 * @kind range-calendar
 * @layer components
 *
 * Compound component: exports root + all sub-components.
 */

export type { RangeCalendarContext } from "./context.js";
export { getRangeCalendarContext, setRangeCalendarContext } from "./context.js";
export { default as RangeCalendar } from "./RangeCalendar.svelte";
export { default as RangeCalendarCell } from "./RangeCalendarCell.svelte";
export { default as RangeCalendarGrid } from "./RangeCalendarGrid.svelte";
export { default as RangeCalendarHeader } from "./RangeCalendarHeader.svelte";
export type {
	DateRange,
	RangeCalendarCellProps,
	RangeCalendarGridProps,
	RangeCalendarHeaderProps,
	RangeCalendarIntent,
	RangeCalendarProps,
	Size as RangeCalendarSize,
} from "./types.js";
