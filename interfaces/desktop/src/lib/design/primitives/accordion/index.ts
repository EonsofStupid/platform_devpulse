/**
 * @file Accordion Primitive Barrel
 */
export { default as Accordion } from "./Accordion.svelte";
export { default as AccordionContent } from "./AccordionContent.svelte";
export { default as AccordionHeader } from "./AccordionHeader.svelte";
export { default as AccordionItem } from "./AccordionItem.svelte";
export { default as AccordionTrigger } from "./AccordionTrigger.svelte";
export {
	type AccordionContext,
	type AccordionItemContext,
	getAccordionContext,
	getAccordionItemContext,
	setAccordionContext,
	setAccordionItemContext,
} from "./context.js";
export type {
	AccordionContentProps,
	AccordionHeaderProps,
	AccordionItemProps,
	AccordionProps,
	AccordionTriggerProps,
} from "./types.js";
