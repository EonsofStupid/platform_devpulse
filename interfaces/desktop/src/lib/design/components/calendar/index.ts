/**
 * @file Calendar Component Barrel
 * @kind calendar
 * @layer components
 *
 * Compound component: exports root + all sub-components.
 */

export { default as Calendar } from "./Calendar.svelte";
export { default as CalendarCell } from "./CalendarCell.svelte";
export { default as CalendarGrid } from "./CalendarGrid.svelte";
export { default as CalendarHeader } from "./CalendarHeader.svelte";
export type { CalendarContext } from "./context.js";
export { getCalendarContext, setCalendarContext } from "./context.js";
export { contract as calendarComponentContract } from "./contract.js";
export { calendarRecipe } from "./recipe.js";
export type {
	CalendarCellProps,
	CalendarGridProps,
	CalendarHeaderProps,
	CalendarProps,
	Size as CalendarSize,
} from "./types.js";
