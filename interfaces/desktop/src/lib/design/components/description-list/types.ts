/**
 * @file DescriptionList Component Types
 * @kind description-list
 * @layer components
 *
 * Extends primitive with ARIA label and visual sizing props.
 * Component layer owns ARIA — primitive is structureless.
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { ComponentProps } from "$lib/design/components/_base/types.js";
import type { BaseProps } from "$lib/design/utils/cn.js";

export type DescriptionListSize = "sm" | "md" | "lg";
export type DescriptionListVariant = "default" | "inline" | "grid";
export type DescriptionListIntent = "default" | "stark" | "glass" | "flat" | "matte";

/** DescriptionList component props — ARIA + composition + ColdLight 8-axis */
export interface DescriptionListComponentProps
	extends Omit<HTMLAttributes<HTMLDListElement>, "style" | "children">,
		BaseProps,
		ComponentProps {
	children?: Snippet;
	/** Style intent. Default: "default". */
	intent?: DescriptionListIntent;
	/** Size variant — controls font size and spacing */
	size?: DescriptionListSize;
	/** Layout variant — controls term/detail arrangement */
	variant?: DescriptionListVariant;
	/** Accessible label for the description list */
	label?: string;
}
