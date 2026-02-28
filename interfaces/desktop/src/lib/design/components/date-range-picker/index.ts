/**
 * @file DateRangePicker Component Barrel
 * @kind date-range-picker
 * @layer components
 *
 * Compound component: exports root + all sub-components.
 */

export { default as DateRangePicker } from "./DateRangePicker.svelte";
export { default as DateRangePickerField } from "./DateRangePickerField.svelte";
export { default as DateRangePickerTrigger } from "./DateRangePickerTrigger.svelte";
export { default as DateRangePickerContent } from "./DateRangePickerContent.svelte";
export { default as DateRangePickerCalendar } from "./DateRangePickerCalendar.svelte";

export { contract as dateRangePickerComponentContract } from "./contract.js";
export { dateRangePickerRecipe } from "./recipe.js";
export { setDateRangePickerContext, getDateRangePickerContext } from "./context.js";

export type { DateRangePickerContext } from "./context.js";
export type {
	DateRangePickerProps,
	DateRangePickerFieldProps,
	DateRangePickerTriggerProps,
	DateRangePickerContentProps,
	DateRangePickerCalendarProps,
	DateRange,
	Size as DateRangePickerSize,
} from "./types.js";
