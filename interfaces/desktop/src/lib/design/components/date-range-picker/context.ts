/**
 * @file DateRangePicker Context — Svelte context for compound component communication
 * @kind date-range-picker
 * @layer components
 *
 * Symbol-keyed context + typed get/set helpers.
 * Root sets context; sub-components consume it.
 * ColdLight-owned — no adapter dependency.
 */

import { getContext, setContext } from "svelte";
import type { DateRange } from "./types.js";

export interface DateRangePickerContext {
	/** Start date of the range */
	readonly startDate: Date | undefined;
	/** End date of the range */
	readonly endDate: Date | undefined;
	/** Whether the popover is open */
	readonly open: boolean;
	/** Whether the picker is disabled */
	readonly disabled: boolean;
	/** Locale for formatting */
	readonly locale: string;
	/** Size variant */
	readonly size: "sm" | "md" | "lg";
	/** Minimum selectable date */
	readonly min: Date | undefined;
	/** Maximum selectable date */
	readonly max: Date | undefined;
	/** ID for the trigger element */
	readonly triggerId: string;
	/** ID for the content element */
	readonly contentId: string;
	/** Toggle the popover open/closed */
	toggle(): void;
	/** Open the popover */
	openPopover(): void;
	/** Close the popover */
	closePopover(): void;
	/** Update the range (from calendar selection) and close */
	selectRange(range: DateRange): void;
	/** Update the range (from field input) without closing */
	updateRange(range: DateRange): void;
}

const DATE_RANGE_PICKER_CTX = Symbol("coldlight-date-range-picker");

export function setDateRangePickerContext(ctx: DateRangePickerContext): void {
	setContext(DATE_RANGE_PICKER_CTX, ctx);
}

export function getDateRangePickerContext(): DateRangePickerContext {
	return getContext<DateRangePickerContext>(DATE_RANGE_PICKER_CTX);
}
