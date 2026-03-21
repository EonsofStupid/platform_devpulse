/**
 * @file Calendar Context
 * @kind calendar
 * @layer components
 */

import { getContext, setContext } from "svelte";
import type { CalendarIds } from "./types.js";

export interface CalendarContext {
	readonly currentMonth: Date;
	readonly selectedDate: Date | null | undefined;
	readonly focusedDate: Date | null;
	readonly today: Date;
	readonly minValue: Date | null | undefined;
	readonly maxValue: Date | null | undefined;
	readonly isDisabled: boolean;
	readonly isReadOnly: boolean;
	readonly isInvalid: boolean;
	readonly locale: string;
	readonly dir: "ltr" | "rtl";
	readonly ids: Partial<CalendarIds>;
	readonly classes: Record<string, string>;
	readonly headingId: string;
	readonly isDateUnavailable: ((date: Date) => boolean) | undefined;
	prevMonth(): void;
	nextMonth(): void;
	selectDate(date: Date): void;
	focusDate(date: Date): void;
	isDateDisabled(date: Date): boolean;
	isOutsideMonth(date: Date): boolean;
	isSelected(date: Date): boolean;
	isToday(date: Date): boolean;
}

const CALENDAR_CTX = Symbol("coldlight-calendar");

export function setCalendarContext(ctx: CalendarContext): void {
	setContext(CALENDAR_CTX, ctx);
}

export function getCalendarContext(): CalendarContext {
	return getContext<CalendarContext>(CALENDAR_CTX);
}
