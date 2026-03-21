/**
 * @file DateField Component Types
 * @kind date-field
 * @layer components
 *
 * Segmented date input. Each part (month, day, year, hour, minute) is
 * an individually editable segment with spinbutton ARIA.
 * Spectrum-aligned: controlled/uncontrolled, validation, form, label.
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { PreparedComponentProps } from "$lib/design/components/_base/types.js";

export type DateFieldSize = "sm" | "md" | "lg" | "xl";
export type DateFieldGranularity = "day" | "month" | "year" | "hour" | "minute" | "second";

export interface DateSegment {
	type: "month" | "day" | "year" | "hour" | "minute" | "second" | "dayPeriod" | "literal";
	value: string;
	placeholder: string;
	min: number;
	max: number;
	numericValue: number | undefined;
}

export interface DateFieldValueChangeDetails {
	value: Date | null;
}

export interface DateFieldIds {
	root?: string;
	label?: string;
	description?: string;
	errorMessage?: string;
}

export interface DateFieldRootProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children" | "class" | "dir">,
		Omit<PreparedComponentProps, "size"> {
	ids?: Partial<DateFieldIds>;
	/** Controlled value. */
	value?: Date | null;
	/** Initial value when uncontrolled. */
	defaultValue?: Date | null;
	/** Callback when value changes. */
	onChange?: (details: DateFieldValueChangeDetails) => void;
	/** Segment granularity. Default: "day". */
	granularity?: DateFieldGranularity;
	/** 12 or 24 hour clock. Default: locale-dependent. */
	hourCycle?: 12 | 24;
	/** Whether to hide the time zone. Default: false. */
	hideTimeZone?: boolean;
	/** Locale (BCP 47). Default: "en-US". */
	locale?: string;
	/** Size variant. Default: "md". */
	size?: DateFieldSize;
	/** Whether the field is disabled. */
	isDisabled?: boolean;
	/** Whether the field is read-only. */
	isReadOnly?: boolean;
	/** Whether the field is required. */
	isRequired?: boolean;
	/** Whether the current value is invalid. */
	isInvalid?: boolean;
	/** Minimum allowed date. */
	minValue?: Date | null;
	/** Maximum allowed date. */
	maxValue?: Date | null;
	/** Validation function. */
	validate?: (value: Date | null) => string | null | undefined;
	/** Validation behavior. Default: "native". */
	validationBehavior?: "native" | "aria";
	/** Label text. */
	label?: string;
	/** Description hint text. */
	description?: string;
	/** Error message. */
	errorMessage?: string;
	/** Input name for form submission (ISO 8601 string). */
	name?: string;
	/** Form element ID. */
	form?: string;
	/** Whether to auto-focus on mount. */
	autoFocus?: boolean;
	/** Text/writing direction. */
	dir?: "ltr" | "rtl";
	children?: Snippet;
}

export interface DateFieldSegmentProps extends Omit<HTMLAttributes<HTMLSpanElement>, "style" | "children" | "class"> {
	children?: Snippet;
	class?: string;
	segment: DateSegment;
	index: number;
}
