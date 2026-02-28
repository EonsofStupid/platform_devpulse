/**
 * @file DateField Context — Svelte context for compound component communication
 * @kind date-field
 * @layer components
 *
 * Symbol-keyed context + typed get/set helpers.
 * Root sets context; sub-components consume it.
 * ColdLight-owned — no adapter dependency.
 */

import { getContext, setContext } from "svelte";
import type { DateSegment, Granularity } from "./types.js";

export interface DateFieldContext {
	/** Current date value */
	readonly value: Date | undefined;
	/** Parsed segments for rendering */
	readonly segments: DateSegment[];
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
	/** Currently focused segment index */
	readonly focusedIndex: number;
	/** Focus a specific segment by index */
	focusSegment(index: number): void;
	/** Increment the value of a segment */
	incrementSegment(index: number): void;
	/** Decrement the value of a segment */
	decrementSegment(index: number): void;
	/** Set a segment value by typing */
	setSegmentValue(index: number, numericValue: number): void;
	/** Move focus to the next segment */
	focusNextSegment(): void;
	/** Move focus to the previous segment */
	focusPrevSegment(): void;
}

const DATE_FIELD_CTX = Symbol("coldlight-date-field");

export function setDateFieldContext(ctx: DateFieldContext): void {
	setContext(DATE_FIELD_CTX, ctx);
}

export function getDateFieldContext(): DateFieldContext {
	return getContext<DateFieldContext>(DATE_FIELD_CTX);
}
