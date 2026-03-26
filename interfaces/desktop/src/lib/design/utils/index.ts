/**
 * @file utils/index.ts
 * @package @devpulse/coldlight
 *
 * ColdLight utility functions barrel export.
 */

export { ariaAnnounce } from "./ariaAnnounce.js";
export { cn } from "./cn.js";
export { idGen, idGenPair } from "./idGen.js";
export { slotMerge } from "./slotMerge.js";
export { tokenResolve } from "./tokenResolve.js";

// ── Fluid Responsive ────────────────────────────────────────────
export {
	clampFluid,
	clampValue,
	FLUID_SPACE,
	FLUID_SIZE,
	FLUID_PADDING,
	type FluidSpace,
	type FluidSize,
	type FluidPadding,
} from "./clamp/index.js";

// ── Layout Utilities ────────────────────────────────────────────
export {
	useAspectRatio,
	type AspectRatioValue,
	type UseAspectRatioProps,
	type UseAspectRatioReturn,
} from "./aspect-ratio/index.js";

export {
	box,
	type BoxProps,
} from "./box/index.js";

export {
	center,
	type CenterProps,
} from "./center/index.js";

export {
	useSpacer,
	type UseSpacerProps,
	type UseSpacerReturn,
} from "./spacer/index.js";

export {
	container,
	type ContainerSize,
	type ContainerProps,
} from "./container/index.js";

export {
	flex,
	type FlexAlign,
	type FlexDirection,
	type FlexJustify,
	type FlexWrap,
	type FlexProps,
} from "./flex/index.js";

export {
	useDivider,
	type DividerOrientation,
	type UseDividerAttrs,
	type UseDividerProps,
	type UseDividerReturn,
} from "./divider/index.js";

export {
	gridLayout,
	type GridLayoutProps,
} from "./grid-layout/index.js";

export {
	hstack,
	type HStackProps,
} from "./hstack/index.js";

export {
	stack,
	type StackProps,
} from "./stack/index.js";

export {
	useSticky,
	type UseStickyProps,
	type UseStickyReturn,
} from "./sticky/index.js";

export {
	useVisuallyHidden,
	type UseVisuallyHiddenProps,
	type UseVisuallyHiddenReturn,
} from "./visually-hidden/index.js";
