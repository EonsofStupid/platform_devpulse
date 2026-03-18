/**
 * @file DatePicker Component Barrel
 * @kind date-picker
 * @layer components
 *
 * Compound component: exports root + all sub-components.
 */

export type { DatePickerContext } from "./context.js";
export { getDatePickerContext, setDatePickerContext } from "./context.js";
export { contract as datePickerComponentContract } from "./contract.js";
export { default as DatePicker } from "./DatePicker.svelte";
export { default as DatePickerCalendar } from "./DatePickerCalendar.svelte";
export { default as DatePickerContent } from "./DatePickerContent.svelte";
export { default as DatePickerField } from "./DatePickerField.svelte";
export { default as DatePickerTrigger } from "./DatePickerTrigger.svelte";
export { datePickerRecipe } from "./recipe.js";
export type {
	DatePickerCalendarProps,
	DatePickerContentProps,
	DatePickerFieldProps,
	DatePickerProps,
	DatePickerTriggerProps,
	Size as DatePickerSize,
} from "./types.js";
