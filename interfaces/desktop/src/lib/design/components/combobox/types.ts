/**
 * @file Combobox Component Types — Gold Standard
 * @kind combobox
 * @layer components
 * @package @devpulse/coldlight
 *
 * Compound component props for Combobox root + all sub-components.
 * MeltUI transport adapter provides ARIA — types declare semantic props only.
 * No raw HTML attribute extends — components use `...rest` for passthrough.
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/combobox/
 * WAI-ARIA 1.3: https://w3c.github.io/aria/
 * WAI-Adapt: https://w3c.github.io/adapt/
 */

import type { Snippet } from "svelte";
import type { ComponentProps } from "$lib/design/components/_base/types.js";
import type { SizeToken } from "$lib/design/recipes/types.js";

// =============================================================================
// ROOT — Combobox wrapper, creates transport + sets context
// =============================================================================

export interface ComboboxProps<T = unknown> extends ComponentProps {
	children?: Snippet;
	/** CSS class for the root wrapper element. */
	class?: string;
	/** Initial/controlled selected value. */
	value?: T;
	/** Called when the selected value changes. */
	onValueChange?: (value: T | undefined) => void;
	/** Controlled input text value. */
	inputValue?: string;
	/** Called when input text changes (for filtering). */
	onInputValueChange?: (value: string) => void;
	/** Controlled open state for the listbox popup. */
	open?: boolean;
	/** Called when the listbox open state changes. */
	onOpenChange?: (open: boolean) => void;
	/**
	 * Size variant — drives height, padding, font-size across all slots.
	 * Uses SD5 SizeToken: "sm" | "md" | "lg".
	 * @default "md"
	 */
	size?: SizeToken;
	/**
	 * Whether the entire combobox is disabled.
	 * Disables input, trigger, and all options.
	 * Recipe applies opacity-50 + pointer-events-none.
	 * @default false
	 */
	disabled?: boolean;
	/**
	 * WAI-Adapt: Machine-readable action purpose.
	 * Declares what this combobox does for AI agents.
	 * @default "filter"
	 */
	"adapt-action"?: string;
	/**
	 * WAI-Adapt: Input purpose declaration.
	 * Maps to autocomplete purpose for AI/AT.
	 * @default "search-term"
	 */
	"adapt-purpose"?: string;
	/**
	 * WAI-Adapt: Cognitive accessibility importance.
	 * AI can use this to simplify UI for users who need fewer choices.
	 * @default "critical"
	 */
	"adapt-simplification"?: "critical" | "medium" | "low";
	/**
	 * ARIA 1.3: Supplementary description for the combobox.
	 * Richer than aria-label — provides additional context.
	 */
	"aria-description"?: string;
}

// =============================================================================
// INPUT — role="combobox", text input with autocomplete
// =============================================================================

export interface ComboboxInputProps {
	/** CSS class for the input element. */
	class?: string;
	/** Placeholder text when input is empty. */
	placeholder?: string;
	/**
	 * WAI-Adapt: Input purpose for this specific field.
	 * Overrides the root-level adapt-purpose.
	 */
	"adapt-purpose"?: string;
	/**
	 * ARIA 1.3: Supplementary description for the input.
	 */
	"aria-description"?: string;
}

// =============================================================================
// TRIGGER — Toggle button, opens/closes listbox
// =============================================================================

export interface ComboboxTriggerProps {
	children?: Snippet;
	/** CSS class for the trigger button. */
	class?: string;
	/** Accessible label for the trigger button (e.g., "Toggle options"). */
	"aria-label"?: string;
}

// =============================================================================
// CONTENT — role="listbox", popup container for options
// =============================================================================

export interface ComboboxContentProps {
	children?: Snippet;
	/** CSS class for the listbox content container. */
	class?: string;
}

// =============================================================================
// ITEM — role="option", individual selectable option
// =============================================================================

export interface ComboboxItemProps {
	children?: Snippet;
	/** CSS class for the option element. */
	class?: string;
	/** Value for this option. Used for selection state. */
	value: string;
	/** Display label for this option. Falls back to stringified value. */
	label?: string;
	/** Whether this option is disabled. */
	disabled?: boolean;
	/**
	 * ARIA 1.3: Supplementary description for this specific option.
	 * Use for additional context beyond the label text.
	 */
	"aria-description"?: string;
}

// =============================================================================
// GROUP — role="group", grouped options with a label
// =============================================================================

export interface ComboboxGroupProps {
	children?: Snippet;
	/** CSS class for the group container. */
	class?: string;
	/** Group label text — used for aria-labelledby linkage. */
	label: string;
}

// =============================================================================
// EMPTY — No-results state, role="status" live region
// =============================================================================

export interface ComboboxEmptyProps {
	children?: Snippet;
	/** CSS class for the empty state container. */
	class?: string;
}

// =============================================================================
// LABEL — Associates a visible label with the combobox input
// =============================================================================

export interface ComboboxLabelProps {
	children?: Snippet;
	/** CSS class for the label element. */
	class?: string;
}

// =============================================================================
// ANNOUNCE — Screen reader live region for result count
// =============================================================================

export interface ComboboxAnnounceProps {
	/** CSS class for the visually-hidden announce region. */
	class?: string;
	/** The announcement text (e.g., "5 results available"). */
	message?: string;
}
