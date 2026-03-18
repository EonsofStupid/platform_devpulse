/**
 * @file DateField Component Barrel
 * @kind date-field
 * @layer components
 *
 * Compound component: exports root + segment sub-component.
 */

export type { DateFieldContext } from "./context.js";
export { getDateFieldContext, setDateFieldContext } from "./context.js";

export { contract as dateFieldComponentContract } from "./contract.js";
export { default as DateField } from "./DateField.svelte";
export { default as DateFieldSegment } from "./DateFieldSegment.svelte";
export { dateFieldRecipe } from "./recipe.js";
export type {
	DateFieldProps,
	DateFieldSegmentProps,
	DateSegment,
	Granularity,
	Size as DateFieldSize,
} from "./types.js";
