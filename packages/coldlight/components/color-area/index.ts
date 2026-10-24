export { default as Root } from "./ColorArea.svelte";
export { default as Gradient } from "./ColorAreaGradient.svelte";
export { default as Thumb } from "./ColorAreaThumb.svelte";
export {
	buildColorString,
	type ChannelRange,
	getChannelRange,
	percentToValue,
	valueToPercent,
} from "./color-utils.js";
export type {
	ColorAreaChangeDetails,
	ColorAreaGradientProps,
	ColorAreaIds,
	ColorAreaPreset,
	ColorAreaRootProps,
	ColorAreaThumbProps,
	ColorChannel,
	ColorSpace,
	ColorValue,
} from "./types.js";
