/**
 * @file Select Component Types
 * @kind select
 * @layer components
 *
 * Compound component props for Select root + sub-components.
 * MeltUI transport adapter provides ARIA — types declare structural props only.
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/listbox/
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes, HTMLButtonAttributes } from "svelte/elements";
import type { ColdLightProps } from "$lib/design/components/_base/types.js";
import type { BaseProps } from "$lib/design/utils/cn.js";

// =============================================================================
// ROOT PROPS
// =============================================================================

export interface SelectProps<T = unknown>
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">,
		BaseProps,
		ColdLightProps {
	children?: Snippet;
	/** Initial/controlled selected value. */
	value?: T;
	/** Called when selected value changes. */
	onValueChange?: (value: T) => void;
	/** Controlled open state. */
	open?: boolean;
	/** Called when open state changes. */
	onOpenChange?: (open: boolean) => void;
	/** Placeholder text when no value is selected. */
	placeholder?: string;
}

// =============================================================================
// TRIGGER PROPS
// =============================================================================

export interface SelectTriggerProps
	extends Omit<HTMLButtonAttributes, "style" | "children">,
		BaseProps {
	children?: Snippet;
}

// =============================================================================
// CONTENT PROPS
// =============================================================================

export interface SelectContentProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">,
		BaseProps {
	children?: Snippet;
}

// =============================================================================
// ITEM PROPS
// =============================================================================

export interface SelectItemProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">,
		BaseProps {
	children?: Snippet;
	/** Value for this option. */
	value: string;
}

// =============================================================================
// LABEL PROPS
// =============================================================================

export interface SelectLabelProps
	extends Omit<HTMLAttributes<HTMLSpanElement>, "style" | "children">,
		BaseProps {
	children?: Snippet;
}

// =============================================================================
// GROUP PROPS
// =============================================================================

export interface SelectGroupProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">,
		BaseProps {
	children?: Snippet;
}
