/**
 * @file Select Component Types
 * @kind select
 * @layer components
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-select-only/
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes, HTMLButtonAttributes } from "svelte/elements";
import type { ComponentProps } from "$lib/design/components/_base/types.js";

// =============================================================================
// ROOT
// =============================================================================

export type SelectPreset = "default" | "stark" | "glass" | "flat" | "matte";

export interface SelectProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children" | "class">,
		ComponentProps {
	/** Style preset preset */
	preset?: SelectPreset;
	children?: Snippet;
	value?: string;
	onValueChange?: (value: string) => void;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	placeholder?: string;
	disabled?: boolean;
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

export interface SelectTriggerProps
	extends Omit<HTMLButtonAttributes, "style" | "children" | "class"> {
	children?: Snippet;
	class?: string;
}

export interface SelectContentProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children" | "class"> {
	children?: Snippet;
	class?: string;
}

export interface SelectItemProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children" | "class"> {
	children?: Snippet;
	class?: string;
	value: string;
	disabled?: boolean;
}

export interface SelectLabelProps
	extends Omit<HTMLAttributes<HTMLElement>, "style" | "children" | "class"> {
	children?: Snippet;
	class?: string;
}

export interface SelectGroupProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children" | "class"> {
	children?: Snippet;
	class?: string;
}
