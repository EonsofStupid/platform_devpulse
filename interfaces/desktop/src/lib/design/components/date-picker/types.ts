/**
 * @file DatePicker Component Types
 * @kind date-picker
 * @layer components
 *
 * Combines DateField segmented input + Calendar popover.
 * Compound: Root, Input (field), Trigger, Content (popover), Calendar.
 * Spectrum-aligned: controlled/uncontrolled value + popover, validation, form.
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { ComponentProps } from "$lib/design/components/_base/types.js";

export type DatePickerSize = "sm" | "md" | "lg" | "xl";
export type DatePickerGranularity = "day" | "month" | "year" | "hour" | "minute" | "second";
export type DatePickerIntent = "default" | "stark" | "glass" | "flat" | "matte";

export interface DatePickerValueChangeDetails {
	value: Date | null;
}

export interface DatePickerOpenChangeDetails {
	open: boolean;
}

export interface DatePickerIds {
	root?: string;
	field?: string;
	trigger?: string;
	content?: string;
	label?: string;
	description?: string;
	errorMessage?: string;
}

export interface DatePickerRootProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children" | "class" | "dir">,
		ComponentProps {
	ids?: Partial<DatePickerIds>;
	/** Style intent. Default: "default". */
	intent?: DatePickerIntent;
	/** Controlled date value. */
	value?: Date | null;
	/** Initial value (uncontrolled). */
	defaultValue?: Date | null;
	/** Callback when value changes. */
	onChange?: (details: DatePickerValueChangeDetails) => void;
	/** Controlled popover open state. */
	isOpen?: boolean;
	/** Initial popover open state (uncontrolled). */
	defaultOpen?: boolean;
	/** Callback when popover opens/closes. */
	onOpenChange?: (details: DatePickerOpenChangeDetails) => void;
	/** Whether to close popover on date selection. Default: true. */
	shouldCloseOnSelect?: boolean;
	/** Segment granularity. Default: "day". */
	granularity?: DatePickerGranularity;
	/** Number of months visible in calendar. Default: 1. */
	maxVisibleMonths?: number;
	/** Callback to check if a date is unavailable. */
	isDateUnavailable?: (date: Date) => boolean;
	/** Minimum selectable date. */
	minValue?: Date | null;
	/** Maximum selectable date. */
	maxValue?: Date | null;
	/** First day of week. */
	firstDayOfWeek?: "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat";
	/** Whether disabled. */
	isDisabled?: boolean;
	/** Whether read-only. */
	isReadOnly?: boolean;
	/** Whether required. */
	isRequired?: boolean;
	/** Whether invalid. */
	isInvalid?: boolean;
	/** Validation function. */
	validate?: (value: Date | null) => string | null | undefined;
	/** Size. Default: "md". */
	size?: DatePickerSize;
	/** Locale (BCP 47). Default: "en-US". */
	locale?: string;
	/** Label text. */
	label?: string;
	/** Description hint. */
	description?: string;
	/** Error message. */
	errorMessage?: string;
	/** Form input name (ISO 8601). */
	name?: string;
	/** Form element ID. */
	form?: string;
	/** RTL. */
	dir?: "ltr" | "rtl";
	children?: Snippet;
}

interface DatePickerSlotProps extends Omit<HTMLAttributes<HTMLElement>, "style" | "children" | "class"> {
	children?: Snippet;
	class?: string;
}

export interface DatePickerInputProps extends DatePickerSlotProps {}
export interface DatePickerTriggerProps extends DatePickerSlotProps {}
export interface DatePickerContentProps extends DatePickerSlotProps {}
export interface DatePickerCalendarProps extends DatePickerSlotProps {}
