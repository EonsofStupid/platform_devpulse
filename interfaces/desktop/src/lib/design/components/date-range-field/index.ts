/**
 * @file DateRangeField Component Barrel
 * @kind date-range-field
 * @layer components
 *
 * Compound component: exports root + all sub-components.
 */

export type { DateRangeFieldContext } from "./context.js";
export { getDateRangeFieldContext, setDateRangeFieldContext } from "./context.js";
export { default as DateRangeField } from "./DateRangeField.svelte";
export { default as DateRangeFieldEnd } from "./DateRangeFieldEnd.svelte";
export { default as DateRangeFieldSegment } from "./DateRangeFieldSegment.svelte";
export { default as DateRangeFieldStart } from "./DateRangeFieldStart.svelte";
export type {
	DateRangeFieldIntent,
	DateRange,
	DateRangeFieldEndProps,
	DateRangeFieldProps,
	DateRangeFieldSegmentProps,
	DateRangeFieldStartProps,
	DateSegment,
	Granularity,
	Size as DateRangeFieldSize,
} from "./types.js";
