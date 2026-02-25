/**
 * @file Select Component Barrel
 * @kind select
 * @layer components
 */

export { default as Select } from "./Select.svelte";
export { default as SelectTrigger } from "./SelectTrigger.svelte";
export { default as SelectContent } from "./SelectContent.svelte";
export { default as SelectItem } from "./SelectItem.svelte";
export { default as SelectLabel } from "./SelectLabel.svelte";
export { default as SelectGroup } from "./SelectGroup.svelte";
export { contract as selectComponentContract } from "./contract.js";
export { selectRecipe } from "./recipe.js";
export type {
	SelectProps,
	SelectTriggerProps,
	SelectContentProps,
	SelectItemProps,
	SelectLabelProps,
	SelectGroupProps,
} from "./types.js";
