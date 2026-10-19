/**
 * @file RangeCalendar Context — Svelte context for compound component communication
 * @kind range-calendar
 * @layer components
 *
 * Symbol-keyed context + typed get/set helpers.
 * Root sets context; sub-components consume it.
 * ColdLight-owned — no adapter dependency.
 */

import { getContext, setContext } from "svelte";

export interface RangeCalendarContext {
	/** Currently displayed month */
	readonly currentMonth: Date;
	/** Range start date */
	readonly startDate: Date | undefined;
	/** Range end date */
	readonly endDate: Date | undefined;
	/** Currently hovered date for range preview */
	readonly hoveredDate: Date | undefined;
	/** Today's date for highlighting */
	readonly today: Date;
	/** Minimum selectable date */
	readonly min: Date | undefined;
	/** Maximum selectable date */
	readonly max: Date | undefined;
	/** Whether the calendar is disabled */
	readonly disabled: boolean;
	/** Locale for formatting */
	readonly locale: string;
	/** Size variant */
	readonly size: "sm" | "md" | "lg";
	/** Navigate to the previous month */
	prevMonth(): void;
	/** Navigate to the next month */
	nextMonth(): void;
	/** Handle date selection (start or end of range) */
	selectDate(date: Date): void;
	/** Set hovered date for range preview */
	setHoveredDate(date: Date | undefined): void;
	/** Check if a date is disabled */
	isDateDisabled(date: Date): boolean;
	/** Check if a date is outside the current month */
	isOutsideMonth(date: Date): boolean;
	/** Check if a date is the range start */
	isRangeStart(date: Date): boolean;
	/** Check if a date is the range end */
	isRangeEnd(date: Date): boolean;
	/** Check if a date is within the range */
	isInRange(date: Date): boolean;
	/** Check if a date is selected (start or end) */
	isSelected(date: Date): boolean;
	/** Check if a date is today */
	isToday(date: Date): boolean;
	/** Heading ID for aria-labelledby */
	readonly headingId: string;
}

const RANGE_CALENDAR_CTX = Symbol("coldlight-range-calendar");

export function setRangeCalendarContext(ctx: RangeCalendarContext): void {
	setContext(RANGE_CALENDAR_CTX, ctx);
}

export function getRangeCalendarContext(): RangeCalendarContext {
	return getContext<RangeCalendarContext>(RANGE_CALENDAR_CTX);
}
