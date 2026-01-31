/**
 * @file Tooltip Primitive Barrel
 */
export { default as Tooltip } from "./Tooltip.svelte";
export { default as TooltipTrigger } from "./TooltipTrigger.svelte";
export { default as TooltipContent } from "./TooltipContent.svelte";
export { default as TooltipArrow } from "./TooltipArrow.svelte";

export type {
	TooltipProps,
	TooltipTriggerProps,
	TooltipContentProps,
	TooltipArrowProps,
} from "./types.js";

export { setTooltipContext, getTooltipContext, type TooltipContext } from "./context.js";
