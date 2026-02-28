/**
 * @file DatePicker Component Barrel
 * @kind date-picker
 * @layer components
 *
 * Compound component: exports root + all sub-components.
 */

export { default as DatePicker } from "./DatePicker.svelte";
export { default as DatePickerField } from "./DatePickerField.svelte";
export { default as DatePickerTrigger } from "./DatePickerTrigger.svelte";
export { default as DatePickerContent } from "./DatePickerContent.svelte";
export { default as DatePickerCalendar } from "./DatePickerCalendar.svelte";

export { contract as datePickerComponentContract } from "./contract.js";
export { datePickerRecipe } from "./recipe.js";
export { setDatePickerContext, getDatePickerContext } from "./context.js";

export type { DatePickerContext } from "./context.js";
export type {
	DatePickerProps,
	DatePickerFieldProps,
	DatePickerTriggerProps,
	DatePickerContentProps,
	DatePickerCalendarProps,
	Size as DatePickerSize,
} from "./types.js";
