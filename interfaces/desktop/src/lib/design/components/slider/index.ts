/**
 * @file Slider Component Barrel
 * @kind slider
 * @layer components
 */

export { contract as sliderComponentContract } from "./contract.js";
export { sliderRecipe } from "./recipe.js";
export { default as Slider } from "./Slider.svelte";
export { default as SliderRange } from "./SliderRange.svelte";
export { default as SliderThumb } from "./SliderThumb.svelte";
export { default as SliderTrack } from "./SliderTrack.svelte";
export type {
	SliderProps,
	SliderRangeProps,
	SliderThumbProps,
	SliderTrackProps,
} from "./types.js";
