/**
 * @file Accordion Component Types
 * @kind accordion
 *
 * Compound component: Root, Item, Trigger, Content, Indicator.
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/accordion/
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { AccordionPrimitiveProps } from "$lib/design/behaviors/navigation/accordion/index.js";

// =============================================================================
// CALLBACK DETAILS
// =============================================================================

export interface AccordionValueChangeDetails {
	value: string | string[];
}

// =============================================================================
// IDS
// =============================================================================

export interface AccordionIds {
	root?: string;
	item?: (value: string) => string;
	trigger?: (value: string) => string;
	content?: (value: string) => string;
}

// =============================================================================
// ROOT
// =============================================================================

export type AccordionSize = "sm" | "md" | "lg";
export type AccordionPreset = "default" | "stark" | "glass" | "flat" | "matte";

export interface AccordionRootProps extends Omit<AccordionPrimitiveProps, "onValueChange"> {
	/** Element IDs for composition. */
	ids?: Partial<AccordionIds>;
	/** Callback when expanded value changes. */
	onValueChange?: (details: AccordionValueChangeDetails) => void;
	/** Text/writing direction. Default: "ltr". */
	dir?: "ltr" | "rtl";
	/** Structural size. Default: "md" */
	size?: AccordionSize;
	/** Visual preset — selects style configuration. Default: "default" */
	preset?: AccordionPreset;
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

interface AccordionSlotProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
	children?: Snippet;
	class?: string;
	element?: Snippet<[HTMLAttributes<HTMLElement>]>;
}

export interface AccordionItemProps extends AccordionSlotProps {
	value: string;
	disabled?: boolean;
}

export interface AccordionTriggerProps extends AccordionSlotProps {}
export interface AccordionContentProps extends AccordionSlotProps {}
export interface AccordionIndicatorProps extends AccordionSlotProps {}
