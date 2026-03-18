/**
 * @file Collapsible Component Barrel
 * @kind collapsible
 * @layer components
 */

export { default as Collapsible } from "./Collapsible.svelte";
export { default as CollapsibleContent } from "./CollapsibleContent.svelte";
export { default as CollapsibleTrigger } from "./CollapsibleTrigger.svelte";
export { contract as collapsibleComponentContract } from "./contract.js";
export { collapsibleRecipe } from "./recipe.js";
export type {
	CollapsibleContentProps,
	CollapsibleProps,
	CollapsibleTriggerProps,
} from "./types.js";
