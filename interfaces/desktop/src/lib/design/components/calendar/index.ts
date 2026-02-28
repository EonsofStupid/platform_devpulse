/**
 * @file Calendar Component Barrel
 * @kind calendar
 * @layer components
 *
 * Compound component: exports root + all sub-components.
 */

export { default as Calendar } from "./Calendar.svelte";
export { default as CalendarHeader } from "./CalendarHeader.svelte";
export { default as CalendarGrid } from "./CalendarGrid.svelte";
export { default as CalendarCell } from "./CalendarCell.svelte";

export { contract as calendarComponentContract } from "./contract.js";
export { calendarRecipe } from "./recipe.js";
export { setCalendarContext, getCalendarContext } from "./context.js";

export type { CalendarContext } from "./context.js";
export type {
	CalendarProps,
	CalendarHeaderProps,
	CalendarGridProps,
	CalendarCellProps,
	Size as CalendarSize,
} from "./types.js";
