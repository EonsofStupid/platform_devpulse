/**
 * @file Collapsible Primitive Barrel
 */
export { default as Collapsible } from "./Collapsible.svelte";
export { default as CollapsibleContent } from "./CollapsibleContent.svelte";
export { default as CollapsibleTrigger } from "./CollapsibleTrigger.svelte";
export {
	type CollapsibleContext,
	getCollapsibleContext,
	setCollapsibleContext,
} from "./context.js";
export type {
	CollapsibleContentProps,
	CollapsibleProps,
	CollapsibleTriggerProps,
} from "./types.js";
