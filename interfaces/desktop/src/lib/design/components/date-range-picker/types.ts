/**
 * @file DateRangePicker Component Types
 * @kind date-range-picker
 * @layer components
 *
 * Prop types for all DateRangePicker sub-components.
 * ColdLight-owned — combines date-range-field + range-calendar in a popover.
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes, HTMLButtonAttributes } from "svelte/elements";
import type { BaseProps } from "$lib/design/primitives/types.js";

// =============================================================================
// SIZE
// =============================================================================

export type Size = "sm" | "md" | "lg";

// =============================================================================
// DATE RANGE
// =============================================================================

export interface DateRange {
	start: Date | undefined;
	end: Date | undefined;
}

// =============================================================================
// ROOT PROPS
// =============================================================================

/** DateRangePicker root props — manages range field + popover state */
export interface DateRangePickerProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">,
		BaseProps {
	children?: Snippet;
	/** Start date of the range */
	startDate?: Date | undefined;
	/** End date of the range */
	endDate?: Date | undefined;
	/** Called when the date range changes */
	onRangeChange?: (range: DateRange) => void;
	/** Whether the popover is open */
	open?: boolean;
	/** Called when the popover open state changes */
	onOpenChange?: (open: boolean) => void;
	/** Minimum selectable date */
	min?: Date;
	/** Maximum selectable date */
	max?: Date;
	/** Whether the picker is disabled */
	disabled?: boolean;
	/** Locale for formatting (BCP 47 tag) */
	locale?: string;
	/** Size variant */
	size?: Size;
}

// =============================================================================
// FIELD PROPS
// =============================================================================

/** DateRangePickerField props — embedded date-range-field */
export interface DateRangePickerFieldProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">,
		BaseProps {
	children?: Snippet;
}

// =============================================================================
// TRIGGER PROPS
// =============================================================================

/** DateRangePickerTrigger props — button that opens range calendar popover */
export interface DateRangePickerTriggerProps
	extends Omit<HTMLButtonAttributes, "style" | "children">,
		BaseProps {
	children?: Snippet;
}

// =============================================================================
// CONTENT PROPS
// =============================================================================

/** DateRangePickerContent props — popover container for range calendar */
export interface DateRangePickerContentProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">,
		BaseProps {
	children?: Snippet;
}

// =============================================================================
// CALENDAR PROPS
// =============================================================================

/** DateRangePickerCalendar props — embedded range calendar */
export interface DateRangePickerCalendarProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">,
		BaseProps {
	children?: Snippet;
}
