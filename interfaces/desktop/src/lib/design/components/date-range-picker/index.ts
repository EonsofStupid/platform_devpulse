/**
 * @file DateRangePicker Component Barrel
 * @kind date-range-picker
 * @layer components
 *
 * Compound component: exports root + all sub-components.
 */

export type { DateRangePickerContext } from "./context.js";
export { getDateRangePickerContext, setDateRangePickerContext } from "./context.js";
export { contract as dateRangePickerComponentContract } from "./contract.js";
export { default as DateRangePicker } from "./DateRangePicker.svelte";
export { default as DateRangePickerCalendar } from "./DateRangePickerCalendar.svelte";
export { default as DateRangePickerContent } from "./DateRangePickerContent.svelte";
export { default as DateRangePickerField } from "./DateRangePickerField.svelte";
export { default as DateRangePickerTrigger } from "./DateRangePickerTrigger.svelte";
export { dateRangePickerRecipe } from "./recipe.js";
export type {
	DateRange,
	DateRangePickerCalendarProps,
	DateRangePickerContentProps,
	DateRangePickerFieldProps,
	DateRangePickerProps,
	DateRangePickerTriggerProps,
	Size as DateRangePickerSize,
} from "./types.js";
