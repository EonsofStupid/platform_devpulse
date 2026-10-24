/**
 * @file utils/index.ts
 * @package @devpulse/coldlight
 *
 * ColdLight utility functions barrel export.
 */

export { ariaAnnounce } from "./ariaAnnounce.js";
// ── Layout Utilities ────────────────────────────────────────────
export {
	type AspectRatioValue,
	type UseAspectRatioProps,
	type UseAspectRatioReturn,
	useAspectRatio,
} from "./aspect-ratio/index.js";
export {
	type BoxProps,
	box,
} from "./box/index.js";
export {
	type CenterProps,
	center,
} from "./center/index.js";
// ── Fluid Responsive ────────────────────────────────────────────
export {
	clampFluid,
	clampValue,
	FLUID_PADDING,
	FLUID_SIZE,
	FLUID_SPACE,
	type FluidPadding,
	type FluidSize,
	type FluidSpace,
} from "./clamp/index.js";
export { cn } from "./cn.js";
export {
	type ContainerProps,
	type ContainerSize,
	container,
} from "./container/index.js";
export {
	type DividerOrientation,
	type UseDividerAttrs,
	type UseDividerProps,
	type UseDividerReturn,
	useDivider,
} from "./divider/index.js";
export {
	type FlexAlign,
	type FlexDirection,
	type FlexJustify,
	type FlexProps,
	type FlexWrap,
	flex,
} from "./flex/index.js";
export {
	type GridLayoutProps,
	gridLayout,
} from "./grid-layout/index.js";
export {
	type HStackProps,
	hstack,
} from "./hstack/index.js";
export { idGen, idGenPair } from "./idGen.js";
export { mergeProps } from "./merge-props.js";
export { slotMerge } from "./slotMerge.js";
export {
	type UseSpacerProps,
	type UseSpacerReturn,
	useSpacer,
} from "./spacer/index.js";
export {
	type StackProps,
	stack,
} from "./stack/index.js";
export {
	type UseStickyProps,
	type UseStickyReturn,
	useSticky,
} from "./sticky/index.js";
export { tokenResolve } from "./tokenResolve.js";

export {
	type UseVisuallyHiddenProps,
	type UseVisuallyHiddenReturn,
	useVisuallyHidden,
} from "./visually-hidden/index.js";
