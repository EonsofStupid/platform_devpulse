/**
 * @file Accordion Component Barrel
 * @kind accordion
 * @layer components
 */

export { default as Accordion } from "./Accordion.svelte";
export { default as AccordionContent } from "./AccordionContent.svelte";
export { default as AccordionItem } from "./AccordionItem.svelte";
export { default as AccordionTrigger } from "./AccordionTrigger.svelte";
export { contract as accordionComponentContract } from "./contract.js";
export { accordionRecipe } from "./recipe.js";
export type {
	AccordionContentProps,
	AccordionItemProps,
	AccordionProps,
	AccordionTriggerProps,
} from "./types.js";
