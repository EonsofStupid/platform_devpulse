/**
 * @file Select Component Barrel
 * @kind select
 * @layer components
 */

export { default as Select } from "./Select.svelte";
export { default as SelectContent } from "./SelectContent.svelte";
export { default as SelectGroup } from "./SelectGroup.svelte";
export { default as SelectItem } from "./SelectItem.svelte";
export { default as SelectLabel } from "./SelectLabel.svelte";
export { default as SelectTrigger } from "./SelectTrigger.svelte";
export { SELECT_DEFAULTS, SELECT_VARIANTS, type SelectVariant } from "./select.generated.js";
export type {
	SelectContentProps,
	SelectGroupProps,
	SelectItemProps,
	SelectLabelProps,
	SelectPreset,
	SelectProps,
	SelectTriggerProps,
} from "./types.js";
