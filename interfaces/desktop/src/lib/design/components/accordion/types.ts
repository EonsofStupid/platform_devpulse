/**
 * @file Accordion Component Types
 * @kind accordion
 * @layer components
 *
 * Compound behavioral component: Root, Item, Trigger, Content, Indicator.
 * ARIA via useAccordion() primitive hook.
 *
 * Follows Ark UI / Zag API conventions:
 *   - ids for composition
 *   - dir for RTL
 *   - controlled (value) vs uncontrolled (defaultValue)
 *   - onValueChange with details
 *   - element render delegation on sub-components
 *   - collapsible, orientation, disabled
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/accordion/
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { PreparedComponentProps } from "$lib/design/components/_base/types.js";

// =============================================================================
// CALLBACK DETAILS
// =============================================================================

/** Details passed to onValueChange callback. */
export interface AccordionValueChangeDetails {
	/** The new expanded value(s). */
	value: string | string[];
}

// =============================================================================
// IDS
// =============================================================================

/** Element IDs for composition. */
export interface AccordionIds {
	root?: string;
	item?: (value: string) => string;
	trigger?: (value: string) => string;
	content?: (value: string) => string;
}

// =============================================================================
// ROOT
// =============================================================================

export interface AccordionRootProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children" | "class" | "dir">,
		PreparedComponentProps {
	/** Element IDs for composition. */
	ids?: Partial<AccordionIds>;
	/** Single (one at a time) or multiple (any number open). Default: "single". */
	type?: "single" | "multiple";
	/** Controlled expanded value. String for single, string[] for multiple. */
	value?: string | string[];
	/** Initial value when uncontrolled. */
	defaultValue?: string | string[];
	/** Callback when expanded value changes. */
	onValueChange?: (details: AccordionValueChangeDetails) => void;
	/** Allow collapsing the last open item in single mode. Default: false. */
	collapsible?: boolean;
	/** Disable all items. Default: false. */
	disabled?: boolean;
	/** Text/writing direction. Default: "ltr". */
	dir?: "ltr" | "rtl";
	/** Layout orientation. Default: "vertical". */
	orientation?: "vertical" | "horizontal";
	children?: Snippet;
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

/** Shared base for accordion sub-component props. */
interface AccordionSlotProps extends Omit<HTMLAttributes<HTMLElement>, "style" | "children" | "class"> {
	children?: Snippet;
	class?: string;
	/** Render the element yourself. */
	element?: Snippet<[HTMLAttributes<HTMLElement>]>;
}

/** Props for Accordion.Item */
export interface AccordionItemProps extends AccordionSlotProps {
	/** Unique identifier for this item. Required. */
	value: string;
	/** Disable this specific item. */
	disabled?: boolean;
}

/** Props for Accordion.Trigger */
export interface AccordionTriggerProps extends AccordionSlotProps {}

/** Props for Accordion.Content */
export interface AccordionContentProps extends AccordionSlotProps {}

/** Props for Accordion.Indicator — the caret/chevron that rotates. */
export interface AccordionIndicatorProps extends AccordionSlotProps {}
