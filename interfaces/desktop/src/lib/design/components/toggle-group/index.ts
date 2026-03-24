/**
 * @file Toggle Group Component Barrel
 * @kind toggle-group
 * @layer components
 */

export { toggleGroupItemComposition, toggleGroupComposition } from "./composition.js";
export { default as ToggleGroup } from "./ToggleGroup.svelte";
export type {
	ToggleGroupComponentProps,
	ToggleGroupItem,
	ToggleGroupOrientation,
	ToggleGroupSize,
} from "./types.js";
