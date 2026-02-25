/**
 * @file Slider Component Barrel
 * @kind slider
 * @layer components
 */

export { default as Slider } from "./Slider.svelte";
export { default as SliderTrack } from "./SliderTrack.svelte";
export { default as SliderRange } from "./SliderRange.svelte";
export { default as SliderThumb } from "./SliderThumb.svelte";
export { contract as sliderComponentContract } from "./contract.js";
export { sliderRecipe } from "./recipe.js";
export type {
	SliderProps,
	SliderTrackProps,
	SliderRangeProps,
	SliderThumbProps,
} from "./types.js";
