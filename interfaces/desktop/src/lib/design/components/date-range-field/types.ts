/**
 * @file DateRangeField Component Types
 * @kind date-range-field
 * @layer components
 *
 * Prop types for all DateRangeField sub-components.
 * ColdLight-owned — renders two segmented date fields for range input.
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/spinbutton/
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { BaseProps } from "$lib/design/primitives/types.js";

// =============================================================================
// SIZE
// =============================================================================

export type Size = "sm" | "md" | "lg";

// =============================================================================
// GRANULARITY
// =============================================================================

export type Granularity = "day" | "month" | "year";

// =============================================================================
// DATE RANGE
// =============================================================================

export interface DateRange {
	start: Date | undefined;
	end: Date | undefined;
}

// =============================================================================
// SEGMENT
// =============================================================================

export interface DateSegment {
	type: "month" | "day" | "year" | "literal";
	value: string;
	placeholder: string;
	min: number;
	max: number;
	numericValue: number | undefined;
}

// =============================================================================
// ROOT PROPS
// =============================================================================

/** DateRangeField root props — manages start/end segmented fields */
export interface DateRangeFieldProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">,
		BaseProps {
	children?: Snippet;
	/** Start date of the range */
	startDate?: Date | undefined;
	/** End date of the range */
	endDate?: Date | undefined;
	/** Called when the date range changes */
	onRangeChange?: (range: DateRange) => void;
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
// START/END FIELD PROPS
// =============================================================================

/** DateRangeFieldStart props — start date field container */
export interface DateRangeFieldStartProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">,
		BaseProps {
	children?: Snippet;
}

/** DateRangeFieldEnd props — end date field container */
export interface DateRangeFieldEndProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">,
		BaseProps {
	children?: Snippet;
}

// =============================================================================
// SEGMENT PROPS
// =============================================================================

/** DateRangeFieldSegment props — individual segment with spinbutton role */
export interface DateRangeFieldSegmentProps
	extends Omit<HTMLAttributes<HTMLSpanElement>, "style" | "children">,
		BaseProps {
	children?: Snippet;
	/** Segment data */
	segment: DateSegment;
	/** Index of this segment */
	index: number;
	/** Which field this segment belongs to */
	field: "start" | "end";
}
