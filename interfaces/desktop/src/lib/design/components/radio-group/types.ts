/**
 * @file RadioGroup Component Types
 * @kind radio-group
 * @layer components
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/radio/
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes, HTMLButtonAttributes } from "svelte/elements";
import type { ComponentProps } from "$lib/design/components/_base/types.js";

export type RadioGroupPreset = "default" | "stark" | "glass" | "flat" | "matte";

export interface RadioGroupProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children" | "class">,
		ComponentProps {
	/** Style preset preset */
	preset?: RadioGroupPreset;
	children?: Snippet;
	value?: string;
	onValueChange?: (value: string) => void;
	disabled?: boolean;
	required?: boolean;
	loop?: boolean;
	orientation?: "horizontal" | "vertical";
}

export interface RadioGroupItemProps
	extends Omit<HTMLButtonAttributes, "style" | "children" | "class"> {
	children?: Snippet;
	class?: string;
	value: string;
	disabled?: boolean;
}

export interface RadioGroupLabelProps
	extends Omit<HTMLAttributes<HTMLElement>, "style" | "children" | "class"> {
	children?: Snippet;
	class?: string;
	value: string;
}
