/**
 * @file Accordion Component Types
 * @kind accordion
 * @layer components
 *
 * Compound component props for Accordion root + sub-components.
 * MeltUI transport adapter provides ARIA — types declare structural props only.
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/accordion/
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { ColdLightProps } from "$lib/design/components/_base/types.js";
import type { BaseProps } from "$lib/design/utils/cn.js";

// =============================================================================
// ROOT PROPS
// =============================================================================

export interface AccordionProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">,
		BaseProps,
		ColdLightProps {
	children?: Snippet;
	/** Allow multiple items to be expanded at once. @default false */
	multiple?: boolean;
	/** Disable the entire accordion. @default false */
	disabled?: boolean;
	/** Controlled expanded value. String for single, string[] for multiple. */
	value?: string | string[];
	/** Called when the expanded value changes. */
	onValueChange?: (value: string | string[]) => void;
}

// =============================================================================
// ITEM PROPS
// =============================================================================

export interface AccordionItemProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">,
		BaseProps {
	children?: Snippet;
	/** Unique identifier for this accordion item. */
	value: string;
	/** Disable this specific item. @default false */
	disabled?: boolean;
}

// =============================================================================
// TRIGGER PROPS
// =============================================================================

export interface AccordionTriggerProps
	extends Omit<HTMLAttributes<HTMLButtonElement>, "style" | "children">,
		BaseProps {
	children?: Snippet;
}

// =============================================================================
// CONTENT PROPS
// =============================================================================

export interface AccordionContentProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">,
		BaseProps {
	children?: Snippet;
}
