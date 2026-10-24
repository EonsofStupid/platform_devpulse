/**
 * @file Select Component Types
 * @kind select
 * @layer components
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-select-only/
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes, HTMLButtonAttributes } from "svelte/elements";
import type { SelectPrimitiveProps } from "#coldlight/behaviors/inputs/select/index.js";
import type { SurfaceFamily } from "#coldlight/renderforge/generated/surfaces.js";
import type { SelectVariant } from "./select.generated.js";

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
	/** The open list's surface role, from select.tokens.json; the family in scope supplies it. Default: "elevated" */
	variant?: SelectVariant;
	/** Family for the open list; unset, it takes the family in scope. */
	surface?: SurfaceFamily;
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
