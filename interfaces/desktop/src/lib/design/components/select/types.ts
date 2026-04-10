/**
 * @file Select Component Types
 * @kind select
 * @layer components
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-select-only/
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes, HTMLButtonAttributes } from "svelte/elements";
import type { SelectPrimitiveProps } from "$lib/design/behaviors/inputs/select/index.js";

// =============================================================================
// ROOT
// =============================================================================

export type SelectPreset = "default" | "stark" | "glass" | "flat" | "matte";

export interface SelectProps extends SelectPrimitiveProps {
	/** Visual preset — selects style configuration. Default: "default" */
	preset?: SelectPreset;
	/** Callback when the selected value changes */
	onValueChange?: (value: string) => void;
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

export interface SelectTriggerProps extends Omit<HTMLButtonAttributes, "children"> {
	children?: Snippet;
	class?: string;
}

export interface SelectContentProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
	children?: Snippet;
	class?: string;
}

export interface SelectItemProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
	children?: Snippet;
	class?: string;
	value: string;
	disabled?: boolean;
}

export interface SelectLabelProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
	children?: Snippet;
	class?: string;
}

export interface SelectGroupProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
	children?: Snippet;
	class?: string;
}
