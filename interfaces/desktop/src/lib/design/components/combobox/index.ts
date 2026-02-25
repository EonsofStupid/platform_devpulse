/**
 * @file Combobox Component Barrel
 * @kind combobox
 * @layer components
 */

export { default as Combobox } from "./Combobox.svelte";
export { default as ComboboxInput } from "./ComboboxInput.svelte";
export { default as ComboboxTrigger } from "./ComboboxTrigger.svelte";
export { default as ComboboxContent } from "./ComboboxContent.svelte";
export { default as ComboboxItem } from "./ComboboxItem.svelte";
export { default as ComboboxEmpty } from "./ComboboxEmpty.svelte";
export { default as ComboboxLabel } from "./ComboboxLabel.svelte";
export { contract as comboboxComponentContract } from "./contract.js";
export { comboboxRecipe } from "./recipe.js";
export type {
	ComboboxProps,
	ComboboxInputProps,
	ComboboxTriggerProps,
	ComboboxContentProps,
	ComboboxItemProps,
	ComboboxEmptyProps,
	ComboboxLabelProps,
} from "./types.js";
export type { ComboboxContext } from "./context.js";
