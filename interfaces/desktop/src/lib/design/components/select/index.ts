/**
 * @file Select Component Barrel
 * @kind select
 * @layer components
 */

export { contract as selectComponentContract } from "./contract.js";
export { selectComposition } from "./composition.js";
export { default as Select } from "./Select.svelte";
export { default as SelectContent } from "./SelectContent.svelte";
export { default as SelectGroup } from "./SelectGroup.svelte";
export { default as SelectItem } from "./SelectItem.svelte";
export { default as SelectLabel } from "./SelectLabel.svelte";
export { default as SelectTrigger } from "./SelectTrigger.svelte";
export type {
	SelectContentProps,
	SelectGroupProps,
	SelectItemProps,
	SelectLabelProps,
	SelectProps,
	SelectTriggerProps,
} from "./types.js";
