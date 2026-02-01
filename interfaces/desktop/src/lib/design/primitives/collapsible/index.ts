/**
 * @file Collapsible Primitive Barrel
 */
export { default as Collapsible } from "./Collapsible.svelte";
export { default as CollapsibleTrigger } from "./CollapsibleTrigger.svelte";
export { default as CollapsibleContent } from "./CollapsibleContent.svelte";

export type {
	CollapsibleProps,
	CollapsibleTriggerProps,
	CollapsibleContentProps,
} from "./types.js";

export { setCollapsibleContext, getCollapsibleContext, type CollapsibleContext } from "./context.js";
