export { default as Root } from "./ColorSlider.svelte";
export { default as Track } from "./ColorSliderTrack.svelte";
export { default as Thumb } from "./ColorSliderThumb.svelte";
export { contract as colorSliderComponentContract } from "./contract.js";
export type {
	SliderOrientation,
	ColorSliderIds,
	ColorSliderChangeDetails,
	ColorSliderRootProps,
	ColorSliderTrackProps,
	ColorSliderThumbProps,
} from "./types.js";
