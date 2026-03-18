/**
 * @file Toggle Group Component Barrel
 * @kind toggle-group
 * @layer components
 */

export { contract as toggleGroupComponentContract } from "./contract.js";
export { toggleGroupItemRecipe, toggleGroupRecipe } from "./recipe.js";
export { default as ToggleGroup } from "./ToggleGroup.svelte";
export type {
	ToggleGroupComponentProps,
	ToggleGroupItem,
	ToggleGroupOrientation,
	ToggleGroupSize,
} from "./types.js";
