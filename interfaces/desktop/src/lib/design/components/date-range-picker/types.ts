/**
 * @file DateRangePicker Component Types
 * @kind date-range-picker
 * @layer components
 *
 * Two DateFields (start/end) + RangeCalendar popover.
 * Spectrum + Ark UI aligned: range value, startName/endName, presets, inline.
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { ComponentProps } from "$lib/design/components/_base/types.js";

export interface DateRangeValue {
	start: Date | null;
	end: Date | null;
}

export interface DateRangePickerValueChangeDetails {
	value: DateRangeValue;
}

export interface DateRangePickerOpenChangeDetails {
	open: boolean;
}

export interface DateRangePickerIds {
	root?: string;
	startField?: string;
	endField?: string;
	trigger?: string;
	content?: string;
	label?: string;
	description?: string;
	errorMessage?: string;
}

export type DateRangePickerSize = "sm" | "md" | "lg" | "xl";
export type DateRangePickerGranularity = "day" | "month" | "year" | "hour" | "minute" | "second";

export interface PresetTriggerValue {
	label: string;
	value: DateRangeValue;
}

export interface DateRangePickerRootProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children" | "class" | "dir">,
		ComponentProps {
	ids?: Partial<DateRangePickerIds>;
	value?: DateRangeValue | null;
	defaultValue?: DateRangeValue | null;
	onChange?: (details: DateRangePickerValueChangeDetails) => void;
	isOpen?: boolean;
	defaultOpen?: boolean;
	onOpenChange?: (details: DateRangePickerOpenChangeDetails) => void;
	shouldCloseOnSelect?: boolean;
	allowsNonContiguousRanges?: boolean;
	inline?: boolean;
	granularity?: DateRangePickerGranularity;
	maxVisibleMonths?: number;
	isDateUnavailable?: (date: Date) => boolean;
	minValue?: Date | null;
	maxValue?: Date | null;
	firstDayOfWeek?: "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat";
	isDisabled?: boolean;
	isReadOnly?: boolean;
	isRequired?: boolean;
	isInvalid?: boolean;
	validate?: (value: DateRangeValue | null) => string | null | undefined;
	size?: DateRangePickerSize;
	locale?: string;
	label?: string;
	description?: string;
	errorMessage?: string;
	startName?: string;
	endName?: string;
	form?: string;
	dir?: "ltr" | "rtl";
	children?: Snippet;
}

interface DateRangePickerSlotProps extends Omit<HTMLAttributes<HTMLElement>, "style" | "children" | "class"> {
	children?: Snippet;
	class?: string;
}

export interface DateRangePickerInputProps extends DateRangePickerSlotProps {
	index: 0 | 1;
}

export interface DateRangePickerTriggerProps extends DateRangePickerSlotProps {}
export interface DateRangePickerContentProps extends DateRangePickerSlotProps {}
export interface DateRangePickerCalendarProps extends DateRangePickerSlotProps {}

export interface DateRangePickerPresetTriggerProps extends DateRangePickerSlotProps {
	preset: PresetTriggerValue;
}
