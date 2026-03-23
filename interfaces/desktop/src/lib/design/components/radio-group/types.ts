/**
 * @file RadioGroup Component Types
 * @kind radio-group
 * @layer components
 *
 * Compound component props for RadioGroup root + sub-components.
 * MeltUI transport adapter provides ARIA — types declare structural props only.
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/radio/
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes, HTMLButtonAttributes } from "svelte/elements";
import type { ComponentProps } from "$lib/design/components/_base/types.js";
import type { BaseProps } from "$lib/design/utils/cn.js";

export interface RadioGroupProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">,
		BaseProps,
		ComponentProps {
	children?: Snippet;
	/** Initial/controlled selected value. */
	value?: string;
	/** Called when selected value changes. */
	onValueChange?: (value: string) => void;
	/** Whether the radio group is disabled. */
	disabled?: boolean;
	/** Whether the radio group is required. */
	required?: boolean;
	/** Whether keyboard navigation loops. @default true */
	loop?: boolean;
	/** Radio group orientation. @default "vertical" */
	orientation?: "horizontal" | "vertical";
}

export interface RadioGroupItemProps
	extends Omit<HTMLButtonAttributes, "style" | "children">,
		BaseProps {
	children?: Snippet;
	/** Value for this radio item. */
	value: string;
}

export interface RadioGroupLabelProps
	extends Omit<HTMLAttributes<HTMLSpanElement>, "style" | "children">,
		BaseProps {
	children?: Snippet;
}
