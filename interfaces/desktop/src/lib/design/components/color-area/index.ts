export { default as Root } from "./ColorArea.svelte";
export { default as Thumb } from "./ColorAreaThumb.svelte";
export { default as Gradient } from "./ColorAreaGradient.svelte";
export type {
	ColorSpace,
	ColorChannel,
	ColorValue,
	ColorAreaIds,
	ColorAreaChangeDetails,
	ColorAreaRootProps,
	ColorAreaThumbProps,
	ColorAreaGradientProps,
	ColorAreaIntent,
} from "./types.js";
export {
	getChannelRange,
	percentToValue,
	valueToPercent,
	buildColorString,
	type ChannelRange,
} from "./color-utils.js";
