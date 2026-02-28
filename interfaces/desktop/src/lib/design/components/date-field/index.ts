/**
 * @file DateField Component Barrel
 * @kind date-field
 * @layer components
 *
 * Compound component: exports root + segment sub-component.
 */

export { default as DateField } from "./DateField.svelte";
export { default as DateFieldSegment } from "./DateFieldSegment.svelte";

export { contract as dateFieldComponentContract } from "./contract.js";
export { dateFieldRecipe } from "./recipe.js";
export { setDateFieldContext, getDateFieldContext } from "./context.js";

export type { DateFieldContext } from "./context.js";
export type {
	DateFieldProps,
	DateFieldSegmentProps,
	DateSegment,
	Granularity,
	Size as DateFieldSize,
} from "./types.js";
