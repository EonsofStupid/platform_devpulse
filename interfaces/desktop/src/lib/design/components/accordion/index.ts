/**
 * @file Accordion Component — barrel export
 * @kind accordion
 *
 * NOTE: Users should import from ui/accordion/, not here.
 * This is the DUMB structural compound component.
 */

export { default as Root } from "./Accordion.svelte";
export { default as Item } from "./AccordionItem.svelte";
export { default as Trigger } from "./AccordionTrigger.svelte";
export { default as Content } from "./AccordionContent.svelte";
export { default as Indicator } from "./AccordionIndicator.svelte";
export type {
	AccordionIds,
	AccordionSize,
	AccordionIntent,
	AccordionValueChangeDetails,
	AccordionRootProps,
	AccordionItemProps,
	AccordionTriggerProps,
	AccordionContentProps,
	AccordionIndicatorProps,
} from "./types.js";
