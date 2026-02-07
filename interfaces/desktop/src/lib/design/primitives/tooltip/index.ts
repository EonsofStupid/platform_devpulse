/**
 * @file Tooltip Primitive Barrel
 */

export { getTooltipContext, setTooltipContext, type TooltipContext } from "./context.js";
export { default as Tooltip } from "./Tooltip.svelte";
export { default as TooltipArrow } from "./TooltipArrow.svelte";
export { default as TooltipContent } from "./TooltipContent.svelte";
export { default as TooltipTrigger } from "./TooltipTrigger.svelte";
export type {
	TooltipArrowProps,
	TooltipContentProps,
	TooltipProps,
	TooltipTriggerProps,
} from "./types.js";
