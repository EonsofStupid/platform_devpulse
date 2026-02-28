/**
 * @file DateRangeField Context — Svelte context for compound component communication
 * @kind date-range-field
 * @layer components
 *
 * Symbol-keyed context + typed get/set helpers.
 * Root sets context; sub-components consume it.
 * ColdLight-owned — no adapter dependency.
 */

import { getContext, setContext } from "svelte";
import type { DateSegment, Granularity } from "./types.js";

export interface DateRangeFieldContext {
	/** Start date value */
	readonly startDate: Date | undefined;
	/** End date value */
	readonly endDate: Date | undefined;
	/** Start date segments */
	readonly startSegments: DateSegment[];
	/** End date segments */
	readonly endSegments: DateSegment[];
	/** Segment granularity */
	readonly granularity: Granularity;
	/** Whether the field is disabled */
	readonly disabled: boolean;
	/** Whether the field is readonly */
	readonly readonly: boolean;
	/** Locale for formatting */
	readonly locale: string;
	/** Size variant */
	readonly size: "sm" | "md" | "lg";
	/** Currently focused field ("start" or "end") */
	readonly focusedField: "start" | "end";
	/** Currently focused segment index within the focused field */
	readonly focusedIndex: number;
	/** Focus a specific segment */
	focusSegment(field: "start" | "end", index: number): void;
	/** Increment a segment value */
	incrementSegment(field: "start" | "end", index: number): void;
	/** Decrement a segment value */
	decrementSegment(field: "start" | "end", index: number): void;
	/** Set a segment value by typing */
	setSegmentValue(field: "start" | "end", index: number, numericValue: number): void;
	/** Move focus to the next segment (across fields) */
	focusNextSegment(): void;
	/** Move focus to the previous segment (across fields) */
	focusPrevSegment(): void;
}

const DATE_RANGE_FIELD_CTX = Symbol("coldlight-date-range-field");

export function setDateRangeFieldContext(ctx: DateRangeFieldContext): void {
	setContext(DATE_RANGE_FIELD_CTX, ctx);
}

export function getDateRangeFieldContext(): DateRangeFieldContext {
	return getContext<DateRangeFieldContext>(DATE_RANGE_FIELD_CTX);
}
