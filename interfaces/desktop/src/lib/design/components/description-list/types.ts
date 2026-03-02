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
import type { BaseProps } from "$lib/design/primitives/types.js";
import type { ColdLightProps } from "$lib/design/components/_base/types.js";

export type DescriptionListSize = "sm" | "md" | "lg";
export type DescriptionListVariant = "default" | "inline" | "grid";

/** DescriptionList component props — ARIA + recipe + ColdLight 8-axis */
export interface DescriptionListComponentProps extends Omit<HTMLAttributes<HTMLDListElement>, "style" | "children">, BaseProps, ColdLightProps {
	children?: Snippet;
	/** Size variant — controls font size and spacing */
	size?: DescriptionListSize;
	/** Layout variant — controls term/detail arrangement */
	variant?: DescriptionListVariant;
	/** Accessible label for the description list */
	label?: string;
}
