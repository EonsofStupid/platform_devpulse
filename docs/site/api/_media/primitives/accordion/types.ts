/**
 * @file primitives/accordion/types.ts
 * @kind accordion
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Accordion primitive — expandable content sections.
 * ariaStateProvider: "meltui" — MeltUI adapter handles ARIA via new Accordion().
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/accordion/
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes, HTMLButtonAttributes } from "svelte/elements";
import type { StateToken, SlotStateMap } from "../_schema/types.js";
import type { BaseProps } from "../types.js";

export const accordionSlots = ["root", "item", "trigger", "content"] as const;
export type AccordionSlot = (typeof accordionSlots)[number];

export const accordionStateTokens = [
	"expanded",
	"collapsed",
	"focused",
	"focus-visible",
	"hover",
	"disabled",
] as const satisfies readonly StateToken[];
export type AccordionState = (typeof accordionStateTokens)[number];

export const accordionSlotStates = {
	root: [],
	item: ["expanded", "collapsed", "disabled"],
	trigger: ["expanded", "focused", "focus-visible", "hover", "disabled"],
	content: ["expanded", "collapsed"],
} as const satisfies SlotStateMap<AccordionSlot, AccordionState>;

export interface AccordionRootProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">, BaseProps {
	children?: Snippet;
}

export interface AccordionItemProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">, BaseProps {
	children?: Snippet;
	value: string;
}

export interface AccordionTriggerProps extends Omit<HTMLButtonAttributes, "style" | "children">, BaseProps {
	children?: Snippet;
}

export interface AccordionContentProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">, BaseProps {
	children?: Snippet;
}
