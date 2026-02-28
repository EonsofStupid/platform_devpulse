/**
 * @file DateRangeField Component Barrel
 * @kind date-range-field
 * @layer components
 *
 * Compound component: exports root + all sub-components.
 */

export { default as DateRangeField } from "./DateRangeField.svelte";
export { default as DateRangeFieldStart } from "./DateRangeFieldStart.svelte";
export { default as DateRangeFieldEnd } from "./DateRangeFieldEnd.svelte";
export { default as DateRangeFieldSegment } from "./DateRangeFieldSegment.svelte";

export { contract as dateRangeFieldComponentContract } from "./contract.js";
export { dateRangeFieldRecipe } from "./recipe.js";
export { setDateRangeFieldContext, getDateRangeFieldContext } from "./context.js";

export type { DateRangeFieldContext } from "./context.js";
export type {
	DateRangeFieldProps,
	DateRangeFieldStartProps,
	DateRangeFieldEndProps,
	DateRangeFieldSegmentProps,
	DateRange,
	DateSegment,
	Granularity,
	Size as DateRangeFieldSize,
} from "./types.js";
