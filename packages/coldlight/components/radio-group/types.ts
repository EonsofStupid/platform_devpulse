/**
 * @file RadioGroup Component Types
 * @kind radio-group
 * @layer components
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/radio/
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes, HTMLButtonAttributes } from "svelte/elements";
import type { RadioGroupPrimitiveProps } from "#coldlight/behaviors/inputs/radio-group/index.js";

export type RadioGroupPreset = "default" | "stark" | "glass" | "flat" | "matte";

export interface RadioGroupProps extends RadioGroupPrimitiveProps {
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

export interface RadioGroupItemProps extends Omit<HTMLButtonAttributes, "children"> {
	children?: Snippet;
	class?: string;
	value: string;
	disabled?: boolean;
}

export interface RadioGroupLabelProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
	children?: Snippet;
	class?: string;
	value: string;
}
