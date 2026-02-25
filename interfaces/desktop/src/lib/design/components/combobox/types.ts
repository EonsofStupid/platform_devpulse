/**
 * @file Combobox Component Types
 * @kind combobox
 * @layer components
 *
 * Compound component props for Combobox root + sub-components.
 * MeltUI transport adapter provides ARIA — types declare structural props only.
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/combobox/
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes, HTMLButtonAttributes, HTMLInputAttributes } from "svelte/elements";
import type { BaseProps } from "$lib/design/primitives/types.js";

// =============================================================================
// ROOT PROPS
// =============================================================================

export interface ComboboxProps<T = unknown>
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">,
		BaseProps {
	children?: Snippet;
	/** Initial/controlled selected value. */
	value?: T;
	/** Called when selected value changes. */
	onValueChange?: (value: T | undefined) => void;
	/** Controlled input text value. */
	inputValue?: string;
	/** Called when input text changes. */
	onInputValueChange?: (value: string) => void;
	/** Controlled open state. */
	open?: boolean;
	/** Called when open state changes. */
	onOpenChange?: (open: boolean) => void;
}

// =============================================================================
// INPUT PROPS
// =============================================================================

export interface ComboboxInputProps
	extends Omit<HTMLInputAttributes, "style" | "children">,
		BaseProps {}

// =============================================================================
// TRIGGER PROPS
// =============================================================================

export interface ComboboxTriggerProps
	extends Omit<HTMLButtonAttributes, "style" | "children">,
		BaseProps {
	children?: Snippet;
}

// =============================================================================
// CONTENT PROPS
// =============================================================================

export interface ComboboxContentProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">,
		BaseProps {
	children?: Snippet;
}

// =============================================================================
// ITEM PROPS
// =============================================================================

export interface ComboboxItemProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">,
		BaseProps {
	children?: Snippet;
	/** Value for this option. */
	value: string;
	/** Optional display label for this option. */
	label?: string;
}

// =============================================================================
// EMPTY PROPS
// =============================================================================

export interface ComboboxEmptyProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">,
		BaseProps {
	children?: Snippet;
}

// =============================================================================
// LABEL PROPS
// =============================================================================

export interface ComboboxLabelProps
	extends Omit<HTMLAttributes<HTMLLabelElement>, "style" | "children">,
		BaseProps {
	children?: Snippet;
}
