/**
 * @file Tooltip Component Barrel
 * @kind tooltip
 * @layer components
 */

export { contract as tooltipComponentContract } from "./contract.js";
export { tooltipRecipe } from "./recipe.js";
export { default as Tooltip } from "./Tooltip.svelte";
export { default as TooltipContent } from "./TooltipContent.svelte";
export { default as TooltipTrigger } from "./TooltipTrigger.svelte";
export type {
	TooltipContentProps,
	TooltipProps,
	TooltipTriggerProps,
} from "./types.js";
