/**
 * @file DateField Component Types
 * @kind date-field
 * @layer components
 *
 * Prop types for all DateField sub-components.
 * ColdLight-owned — renders segmented date input with spinbutton ARIA.
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/spinbutton/
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { ColdLightProps } from "$lib/design/components/_base/types.js";
import type { BaseProps } from "$lib/design/utils/cn.js";

// =============================================================================
// SIZE
// =============================================================================

export type Size = "sm" | "md" | "lg";

// =============================================================================
// GRANULARITY
// =============================================================================

export type Granularity = "day" | "month" | "year";

// =============================================================================
// SEGMENT
// =============================================================================

export interface DateSegment {
	type: "month" | "day" | "year" | "literal";
	value: string;
	placeholder: string;
	/** Minimum value for this segment */
	min: number;
	/** Maximum value for this segment */
	max: number;
	/** Current numeric value (undefined if placeholder) */
	numericValue: number | undefined;
}

// =============================================================================
// ROOT PROPS
// =============================================================================

/** DateField root props — manages segmented date input state */
export interface DateFieldProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">,
		BaseProps,
		ColdLightProps {
	children?: Snippet;
	/** Current date value */
	value?: Date | undefined;
	/** Called when the date value changes */
	onValueChange?: (value: Date | undefined) => void;
	/** Segment granularity */
	granularity?: Granularity;
	/** Locale for formatting (BCP 47 tag) */
	locale?: string;
	/** Whether the field is disabled */
	disabled?: boolean;
	/** Whether the field is readonly */
	readonly?: boolean;
	/** Size variant */
	size?: Size;
}

// =============================================================================
// SEGMENT PROPS
// =============================================================================

/** DateFieldSegment props — individual segment with spinbutton role */
export interface DateFieldSegmentProps
	extends Omit<HTMLAttributes<HTMLSpanElement>, "style" | "children">,
		BaseProps {
	children?: Snippet;
	/** Segment data from context */
	segment: DateSegment;
	/** Index of this segment in the segment list */
	index: number;
}
