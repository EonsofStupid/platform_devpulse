/**
 * @file Accordion Component — barrel export
 * @kind accordion
 *
 * NOTE: Users should import from ui/accordion/, not here.
 * This is the DUMB structural compound component.
 */

export { default as Root } from "./Accordion.svelte";
export { default as Content } from "./AccordionContent.svelte";
export { default as Indicator } from "./AccordionIndicator.svelte";
export { default as Item } from "./AccordionItem.svelte";
export { default as Trigger } from "./AccordionTrigger.svelte";
export type {
	AccordionContentProps,
	AccordionIds,
	AccordionIndicatorProps,
	AccordionItemProps,
	AccordionPreset,
	AccordionRootProps,
	AccordionSize,
	AccordionTriggerProps,
	AccordionValueChangeDetails,
} from "./types.js";
