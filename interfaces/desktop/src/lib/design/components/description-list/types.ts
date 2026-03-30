/**
 * @file DescriptionList Component Types
 * @kind description-list
 * @layer components
 *
 * Extends primitive with ARIA label and visual sizing props.
 * Component layer owns ARIA — primitive is structureless.
 *
 * Extends DescriptionListPrimitiveProps from primitives.
 */

import type { DescriptionListPrimitiveProps } from "$lib/design/primitives/description-list/index.js";

export type DescriptionListSize = "sm" | "md" | "lg";
export type DescriptionListVariant = "default" | "inline" | "grid";
export type DescriptionListPreset = "default" | "stark" | "glass" | "flat" | "matte";

/** DescriptionList component props — extends primitive + ARIA + ColdLight preset */
export interface DescriptionListProps extends DescriptionListPrimitiveProps {
	/** Style preset. Default: "default". */
	preset?: DescriptionListPreset;
	/** Size variant — controls font size and spacing */
	size?: DescriptionListSize;
	/** Layout variant — controls term/detail arrangement */
	variant?: DescriptionListVariant;
	/** Accessible label for the description list */
	label?: string;
}
