/**
 * @file RangeCalendar Component Types
 * @kind range-calendar
 * @layer components
 *
 * Prop types for all RangeCalendar sub-components.
 * ColdLight-owned — renders ARIA structure directly.
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/grid/
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes, HTMLButtonAttributes } from "svelte/elements";
import type { ColdLightProps } from "$lib/design/components/_base/types.js";
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

/** RangeCalendar root props — manages date range selection state */
export interface RangeCalendarProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">,
		BaseProps,
		ColdLightProps {
	children?: Snippet;
	/** Start date of the range */
	startDate?: Date | undefined;
	/** End date of the range */
	endDate?: Date | undefined;
	/** Called when the date range changes */
	onRangeChange?: (range: DateRange) => void;
	/** Currently displayed month */
	month?: Date;
	/** Called when the displayed month changes */
	onMonthChange?: (month: Date) => void;
	/** Minimum selectable date */
	min?: Date;
	/** Maximum selectable date */
	max?: Date;
	/** Whether the calendar is disabled */
	disabled?: boolean;
	/** Locale for formatting (BCP 47 tag) */
	locale?: string;
	/** Size variant */
	size?: Size;
}

// =============================================================================
// HEADER PROPS
// =============================================================================

/** RangeCalendarHeader props — month/year display + navigation */
export interface RangeCalendarHeaderProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">,
		BaseProps {
	children?: Snippet;
}

// =============================================================================
// GRID PROPS
// =============================================================================

/** RangeCalendarGrid props — day grid with role="grid" */
export interface RangeCalendarGridProps
	extends Omit<HTMLAttributes<HTMLTableElement>, "style" | "children">,
		BaseProps {
	children?: Snippet;
}

// =============================================================================
// CELL PROPS
// =============================================================================

/** RangeCalendarCell props — individual day cell with range awareness */
export interface RangeCalendarCellProps
	extends Omit<HTMLButtonAttributes, "style" | "children">,
		BaseProps {
	children?: Snippet;
	/** The date this cell represents */
	date: Date;
}
