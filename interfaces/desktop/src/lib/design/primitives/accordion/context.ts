/**
 * @file Accordion Primitive Context
 * @description Svelte context for compound accordion coordination.
 * Root sets context, sub-components read it.
 * Two levels: root context (Accordion) and item context (AccordionItem).
 * Reactive via getter when set from Svelte component with $state.
 */

import { getContext, setContext } from "svelte";

// ─── ROOT CONTEXT ────────────────────────────────────────────────────────
const ACCORDION_KEY = Symbol("coldlight:accordion");

/** Accordion root context shape */
export type AccordionContext = {
	readonly value: readonly string[];
	readonly disabled: boolean;
};

/** Set accordion context (called by Accordion root) */
export function setAccordionContext(ctx: AccordionContext): void {
	setContext(ACCORDION_KEY, ctx);
}

/** Get accordion context (called by sub-components) */
export function getAccordionContext(): AccordionContext {
	return getContext<AccordionContext>(ACCORDION_KEY);
}

// ─── ITEM CONTEXT ────────────────────────────────────────────────────────
const ACCORDION_ITEM_KEY = Symbol("coldlight:accordion-item");

/** Accordion item context shape */
export type AccordionItemContext = {
	readonly open: boolean;
	readonly disabled: boolean;
};

/** Set item context (called by AccordionItem) */
export function setAccordionItemContext(ctx: AccordionItemContext): void {
	setContext(ACCORDION_ITEM_KEY, ctx);
}

/** Get item context (called by AccordionTrigger/Content) */
export function getAccordionItemContext(): AccordionItemContext {
	return getContext<AccordionItemContext>(ACCORDION_ITEM_KEY);
}
