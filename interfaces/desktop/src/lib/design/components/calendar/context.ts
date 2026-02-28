/**
 * @file Calendar Context — Svelte context for compound component communication
 * @kind calendar
 * @layer components
 *
 * Symbol-keyed context + typed get/set helpers.
 * Root sets context; sub-components consume it.
 * ColdLight-owned — no adapter dependency.
 */

import { getContext, setContext } from "svelte";

export interface CalendarContext {
	/** Currently displayed month */
	readonly currentMonth: Date;
	/** Currently selected date */
	readonly selectedDate: Date | undefined;
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
	/** Select a specific date */
	selectDate(date: Date): void;
	/** Check if a date is disabled */
	isDateDisabled(date: Date): boolean;
	/** Check if a date is outside the current month */
	isOutsideMonth(date: Date): boolean;
	/** Check if a date is selected */
	isSelected(date: Date): boolean;
	/** Check if a date is today */
	isToday(date: Date): boolean;
	/** Heading ID for aria-labelledby */
	readonly headingId: string;
}

const CALENDAR_CTX = Symbol("coldlight-calendar");

export function setCalendarContext(ctx: CalendarContext): void {
	setContext(CALENDAR_CTX, ctx);
}

export function getCalendarContext(): CalendarContext {
	return getContext<CalendarContext>(CALENDAR_CTX);
}
