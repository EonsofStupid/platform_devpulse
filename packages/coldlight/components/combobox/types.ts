/**
 * @file Combobox Component Types
 * @kind combobox
 * @layer components
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/combobox/
 */

import type { Snippet } from "svelte";
import type { ComboboxPrimitiveProps } from "#coldlight/behaviors/inputs/combobox/index.js";

export type ComboboxPreset = "default" | "stark" | "glass" | "flat" | "matte";
export type ComboboxSize = "sm" | "md" | "lg";

// =============================================================================
// ROOT
// =============================================================================

export interface ComboboxProps<T = unknown>
	extends Omit<ComboboxPrimitiveProps, "value" | "onValueChange"> {
	/** Visual preset — selects style configuration. Default: "default" */
	preset?: ComboboxPreset;
	/** Size variant. Default: "md" */
	size?: ComboboxSize;
	/** Initial/controlled selected value. */
	value?: T;
	/** Called when the selected value changes. */
	onValueChange?: (value: T | undefined) => void;
	/** Controlled input text value. */
	inputValue?: string;
	/** Called when input text changes (for filtering). */
	onInputValueChange?: (value: string) => void;
	/** WAI-Adapt: Machine-readable action purpose. */
	"adapt-action"?: string;
	/** WAI-Adapt: Input purpose declaration. */
	"adapt-purpose"?: string;
	/** WAI-Adapt: Cognitive accessibility importance. */
	"adapt-simplification"?: "critical" | "medium" | "low";
	/** ARIA 1.3: Supplementary description. */
	"aria-description"?: string;
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

export interface ComboboxInputProps {
	class?: string;
	placeholder?: string;
	"adapt-purpose"?: string;
	"aria-description"?: string;
}

export interface ComboboxTriggerProps {
	children?: Snippet;
	class?: string;
	"aria-label"?: string;
}

export interface ComboboxContentProps {
	children?: Snippet;
	class?: string;
}

export interface ComboboxItemProps {
	children?: Snippet;
	class?: string;
	value: string;
	label?: string;
	disabled?: boolean;
	"aria-description"?: string;
}

export interface ComboboxGroupProps {
	children?: Snippet;
	class?: string;
	label: string;
}

export interface ComboboxEmptyProps {
	children?: Snippet;
	class?: string;
}

export interface ComboboxLabelProps {
	children?: Snippet;
	class?: string;
}

export interface ComboboxAnnounceProps {
	class?: string;
	message?: string;
}
