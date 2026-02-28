/**
 * @file DatePicker Context — Svelte context for compound component communication
 * @kind date-picker
 * @layer components
 *
 * Symbol-keyed context + typed get/set helpers.
 * Root sets context; sub-components consume it.
 * ColdLight-owned — no adapter dependency.
 */

import { getContext, setContext } from "svelte";

export interface DatePickerContext {
	/** Current date value */
	readonly value: Date | undefined;
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
	/** Select a date and close the popover */
	selectDate(date: Date): void;
	/** Update the date value (from field input) */
	updateValue(date: Date | undefined): void;
}

const DATE_PICKER_CTX = Symbol("coldlight-date-picker");

export function setDatePickerContext(ctx: DatePickerContext): void {
	setContext(DATE_PICKER_CTX, ctx);
}

export function getDatePickerContext(): DatePickerContext {
	return getContext<DatePickerContext>(DATE_PICKER_CTX);
}
