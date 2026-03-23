/**
 * @file Accordion Component Types
 * @kind accordion
 *
 * Compound component: Root, Item, Trigger, Content, Indicator.
 * Extends ComponentProps from _base.
 * ARIA via useAccordion() primitive hook.
 * ZERO visual props. Visual comes from StyleMacro via ui/ wrapper.
 *
 * API: Spectrum S2 (expandedKeys, density, size) + Zag (collapsible, orientation, dir)
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { ComponentProps } from "$lib/design/components/_base/types.js";

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

export interface AccordionRootProps
	extends ComponentProps,
		Omit<HTMLAttributes<HTMLDivElement>, "style" | "children" | "class" | "dir"> {
	/** Element IDs for composition. */
	ids?: Partial<AccordionIds>;
	/** Single or multiple expansion. Default: "single". */
	type?: "single" | "multiple";
	/** Controlled expanded value. */
	value?: string | string[];
	/** Initial value (uncontrolled). */
	defaultValue?: string | string[];
	/** Callback when expanded value changes. */
	onValueChange?: (details: AccordionValueChangeDetails) => void;
	/** Allow collapsing last open item in single mode. Default: false. */
	collapsible?: boolean;
	/** Disable all items. Default: false. */
	disabled?: boolean;
	/** Text/writing direction. Default: "ltr". */
	dir?: "ltr" | "rtl";
	/** Layout orientation. Default: "vertical". */
	orientation?: "vertical" | "horizontal";
	/** Structural size. */
	size?: AccordionSize;
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

interface AccordionSlotProps extends Omit<HTMLAttributes<HTMLElement>, "style" | "children" | "class"> {
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
