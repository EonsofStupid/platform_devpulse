/**
 * @file Accordion Context — Svelte context for compound component communication
 * @kind accordion
 * @layer components
 *
 * TWO context levels:
 * 1. Root context: hook return + recipe classes + ids + dir
 * 2. Item context: item value + disabled (set by Item, consumed by Trigger/Content)
 */

import { getContext, setContext } from "svelte";
import type { UseAccordionReturn } from "$lib/design/primitives/accordion/accordion.types.js";
import type { AccordionIds } from "./types.js";

// =============================================================================
// ROOT CONTEXT
// =============================================================================

export interface AccordionContext {
	/** The useAccordion() hook return — provides ARIA attrs for each slot. */
	readonly hook: UseAccordionReturn;
	/** Per-slot recipe class strings. */
	readonly classes: Record<string, string>;
	/** Element IDs for composition. */
	readonly ids: Partial<AccordionIds>;
	/** Text/writing direction. */
	readonly dir: "ltr" | "rtl";
	/** Layout orientation. */
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
// ITEM CONTEXT — set by Item, consumed by Trigger/Content/Indicator
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
