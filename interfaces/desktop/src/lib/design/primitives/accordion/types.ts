/**
 * @file Accordion Primitive Types
 * @description Structural type declarations for the accordion primitive.
 * Aligned to taxonomy contract: kind="accordion"
 * Slots: root, item, header, trigger, content
 * ariaStateProvider: "coldlight" — native HTML handles semantics.
 */

import type { Snippet } from "svelte";
import type { OmitStyle, BaseProps } from "../types.js";

/** Accordion root — context provider, no DOM element */
export interface AccordionProps extends BaseProps {
	/** Which items are open (bindable). Array of item value strings. */
	value?: string[];
	disabled?: boolean;
	children?: Snippet;
}

/** Accordion item — item wrapper providing item-level context */
export interface AccordionItemProps
	extends OmitStyle<HTMLDivElement>,
		BaseProps {
	/** Unique value identifying this item */
	value: string;
	disabled?: boolean;
	children?: Snippet;
}

/** Accordion header — heading wrapper for trigger */
export interface AccordionHeaderProps
	extends OmitStyle<HTMLHeadingElement>,
		BaseProps {
	children?: Snippet;
}

/** Accordion trigger — button that toggles item content */
export interface AccordionTriggerProps
	extends OmitStyle<HTMLButtonElement>,
		BaseProps {
	children?: Snippet;
}

/** Accordion content — expandable content panel */
export interface AccordionContentProps
	extends OmitStyle<HTMLDivElement>,
		BaseProps {
	children?: Snippet;
}
