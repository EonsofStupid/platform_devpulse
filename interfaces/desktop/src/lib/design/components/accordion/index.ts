export { default as Root } from "./Accordion.svelte";
export { default as Item } from "./AccordionItem.svelte";
export { default as Trigger } from "./AccordionTrigger.svelte";
export { default as Content } from "./AccordionContent.svelte";
export { default as Indicator } from "./AccordionIndicator.svelte";
export { contract as accordionComponentContract } from "./contract.js";
export type {
	AccordionIds,
	AccordionValueChangeDetails,
	AccordionRootProps,
	AccordionItemProps,
	AccordionTriggerProps,
	AccordionContentProps,
	AccordionIndicatorProps,
} from "./types.js";
