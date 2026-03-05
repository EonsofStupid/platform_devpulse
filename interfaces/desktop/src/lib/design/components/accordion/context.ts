/**
 * @file Accordion Context — Svelte context for compound component communication
 * @kind accordion
 * @layer components
 *
 * TWO context levels:
 * 1. Root context: AccordionTransport (set by Accordion.svelte)
 * 2. Item context: AccordionItemTransport (set by AccordionItem.svelte)
 *
 * Symbol-keyed context + typed get/set helpers.
 */

import { getContext, setContext } from "svelte";
import type {
	AccordionTransport,
	AccordionItemTransport,
} from "$lib/design/api/dsadapters/meltui/_internal/accordion/index.js";

// =============================================================================
// ROOT CONTEXT — set by Accordion.svelte, consumed by AccordionItem.svelte
// =============================================================================

const ACCORDION_CTX = Symbol("coldlight-accordion");

export function setAccordionContext(transport: AccordionTransport): void {
	setContext(ACCORDION_CTX, transport);
}

export function getAccordionContext(): AccordionTransport {
	return getContext<AccordionTransport>(ACCORDION_CTX);
}

// =============================================================================
// ITEM CONTEXT — set by AccordionItem.svelte, consumed by Trigger/Content
// =============================================================================

const ACCORDION_ITEM_CTX = Symbol("coldlight-accordion-item");

export function setAccordionItemContext(item: AccordionItemTransport): void {
	setContext(ACCORDION_ITEM_CTX, item);
}

export function getAccordionItemContext(): AccordionItemTransport {
	return getContext<AccordionItemTransport>(ACCORDION_ITEM_CTX);
}
