/**
 * @file Accordion Primitive Barrel
 */
export { default as Accordion } from "./Accordion.svelte";
export { default as AccordionItem } from "./AccordionItem.svelte";
export { default as AccordionHeader } from "./AccordionHeader.svelte";
export { default as AccordionTrigger } from "./AccordionTrigger.svelte";
export { default as AccordionContent } from "./AccordionContent.svelte";

export type {
	AccordionProps,
	AccordionItemProps,
	AccordionHeaderProps,
	AccordionTriggerProps,
	AccordionContentProps,
} from "./types.js";

export {
	setAccordionContext,
	getAccordionContext,
	type AccordionContext,
	setAccordionItemContext,
	getAccordionItemContext,
	type AccordionItemContext,
} from "./context.js";
