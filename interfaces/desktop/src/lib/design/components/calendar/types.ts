/**
 * @file Calendar Component Types
 * @kind calendar
 * @layer components
 *
 * Calendar with date selection, navigation, validation.
 * Compound: Root, Header, Grid, Cell.
 * ColdLight-owned ARIA — WAI-ARIA APG Grid Pattern.
 *
 * Spectrum-aligned API: controlled/uncontrolled, validation,
 * focusedValue, visibleMonths, isDateUnavailable, firstDayOfWeek.
 *
 * Uses native Date for now. @internationalized/date can be added later.
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes, HTMLButtonAttributes } from "svelte/elements";
import type { ComponentProps } from "$lib/design/components/_base/types.js";

// =============================================================================
// SHARED
// =============================================================================

export interface CalendarValueChangeDetails {
	value: Date | undefined;
}

export interface CalendarFocusChangeDetails {
	date: Date;
}

export interface CalendarIds {
	root?: string;
	heading?: string;
	grid?: string;
	prevButton?: string;
	nextButton?: string;
}

// =============================================================================
// INTENT
// =============================================================================

export type CalendarPreset = "default" | "stark" | "glass" | "flat" | "matte";

// =============================================================================
// ROOT
// =============================================================================

export interface CalendarRootProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children" | "class" | "dir">,
		ComponentProps {
	ids?: Partial<CalendarIds>;
	/** Style preset. Default: "default". */
	preset?: CalendarPreset;
	/** Controlled selected date. */
	value?: Date | null;
	/** Initial value when uncontrolled. */
	defaultValue?: Date | null;
	/** Callback when selected date changes. */
	onValueChange?: (details: CalendarValueChangeDetails) => void;
	/** Controls the currently focused date. */
	focusedValue?: Date | null;
	/** Initial focused date when uncontrolled. */
	defaultFocusedValue?: Date | null;
	/** Callback when focused date changes. */
	onFocusChange?: (details: CalendarFocusChangeDetails) => void;
	/** Number of months to display at once. Default: 1. */
	visibleMonths?: number;
	/** Callback to check if a date is unavailable. */
	isDateUnavailable?: (date: Date) => boolean;
	/** Whether the calendar is disabled. */
	isDisabled?: boolean;
	/** Whether the calendar is read-only. */
	isReadOnly?: boolean;
	/** Whether the current selection is invalid. */
	isInvalid?: boolean;
	/** Minimum selectable date. */
	minValue?: Date | null;
	/** Maximum selectable date. */
	maxValue?: Date | null;
	/** Day that starts the week. Default: "sun". */
	firstDayOfWeek?: "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat";
	/** Whether to auto-focus the calendar on mount. */
	autoFocus?: boolean;
	/** Locale for formatting (BCP 47 tag). Default: "en-US". */
	locale?: string;
	/** Text/writing direction. */
	dir?: "ltr" | "rtl";
	children?: Snippet;
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

interface CalendarSlotProps
	extends Omit<HTMLAttributes<HTMLElement>, "style" | "children" | "class"> {
	children?: Snippet;
	class?: string;
}

/** CalendarHeader — month/year display + prev/next navigation. */
export interface CalendarHeaderProps extends CalendarSlotProps {}

/** CalendarGrid — the day grid with role="grid". */
export interface CalendarGridProps extends CalendarSlotProps {}

/** CalendarCell — individual day cell button. */
export interface CalendarCellProps
	extends Omit<HTMLButtonAttributes, "style" | "children" | "class"> {
	children?: Snippet;
	class?: string;
	/** The date this cell represents. */
	date: Date;
}
