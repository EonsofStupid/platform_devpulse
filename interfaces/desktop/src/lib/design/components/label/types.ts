/**
 * @file Label Types
 * @kind label
 * @layer components
 */

import type { Snippet } from "svelte";
import type { HTMLLabelAttributes } from "svelte/elements";
import type { ComponentProps } from "$lib/design/components/_base/types.js";
import type { BaseProps } from "$lib/design/utils/cn.js";

export type LabelSize = "sm" | "md" | "lg";
export type LabelIntent = "default" | "stark" | "glass" | "flat" | "matte";

export interface LabelProps
	extends Omit<HTMLLabelAttributes, "style" | "children">,
		BaseProps,
		ComponentProps {
	children?: Snippet;
	htmlFor?: string;
	disabled?: boolean;
	required?: boolean;
	size?: LabelSize;
	/** Visual intent — selects the style preset */
	intent?: LabelIntent;
}
