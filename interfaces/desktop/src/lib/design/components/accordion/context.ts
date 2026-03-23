/**
 * @file Accordion Context — Svelte context for compound component communication
 * @kind accordion
 *
 * TWO context levels:
 * 1. Root context: hook return + ids + dir + orientation
 * 2. Item context: item value + disabled (set by Item, consumed by Trigger/Content)
 *
 * NO composition classes. Visual comes from StyleMacro via [data-kind] glue CSS.
 */

import { getContext, setContext } from "svelte";
import type { UseAccordionReturn } from "$lib/design/primitives/accordion/accordion.types.js";
import type { AccordionIds } from "./types.js";

// =============================================================================
// ROOT CONTEXT
// =============================================================================

export interface AccordionContext {
	readonly hook: UseAccordionReturn;
	readonly ids: Partial<AccordionIds>;
	readonly dir: "ltr" | "rtl";
	readonly orientation: "vertical" | "horizontal";
}

const ACCORDION_CTX = Symbol("coldlight-accordion");

export function setAccordionContext(ctx: AccordionContext): void {
	setContext(ACCORDION_CTX, ctx);
}

export function getAccordionContext(): AccordionContext {
	return getContext<AccordionContext>(ACCORDION_CTX);
}

// =============================================================================
// ITEM CONTEXT
// =============================================================================

export interface AccordionItemContext {
	readonly value: string;
	readonly disabled: boolean;
}

const ACCORDION_ITEM_CTX = Symbol("coldlight-accordion-item");

export function setAccordionItemContext(ctx: AccordionItemContext): void {
	setContext(ACCORDION_ITEM_CTX, ctx);
}

export function getAccordionItemContext(): AccordionItemContext {
	return getContext<AccordionItemContext>(ACCORDION_ITEM_CTX);
}
