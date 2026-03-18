/**
 * @file DatePicker Component Types
 * @kind date-picker
 * @layer components
 *
 * Prop types for all DatePicker sub-components.
 * ColdLight-owned — combines date-field + calendar in a popover.
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes, HTMLButtonAttributes } from "svelte/elements";
import type { ColdLightProps } from "$lib/design/components/_base/types.js";
import type { BaseProps } from "$lib/design/primitives/types.js";

// =============================================================================
// SIZE
// =============================================================================

export type Size = "sm" | "md" | "lg";

// =============================================================================
// ROOT PROPS
// =============================================================================

/** DatePicker root props — manages combined field + popover state */
export interface DatePickerProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">,
		BaseProps,
		ColdLightProps {
	children?: Snippet;
	/** Current date value */
	value?: Date | undefined;
	/** Called when the date value changes */
	onValueChange?: (value: Date | undefined) => void;
	/** Whether the popover is open */
	open?: boolean;
	/** Called when the popover open state changes */
	onOpenChange?: (open: boolean) => void;
	/** Minimum selectable date */
	min?: Date;
	/** Maximum selectable date */
	max?: Date;
	/** Whether the picker is disabled */
	disabled?: boolean;
	/** Locale for formatting (BCP 47 tag) */
	locale?: string;
	/** Size variant */
	size?: Size;
}

// =============================================================================
// FIELD PROPS
// =============================================================================

/** DatePickerField props — embedded date-field for direct input */
export interface DatePickerFieldProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">,
		BaseProps {
	children?: Snippet;
}

// =============================================================================
// TRIGGER PROPS
// =============================================================================

/** DatePickerTrigger props — button that opens the calendar popover */
export interface DatePickerTriggerProps
	extends Omit<HTMLButtonAttributes, "style" | "children">,
		BaseProps {
	children?: Snippet;
}

// =============================================================================
// CONTENT PROPS
// =============================================================================

/** DatePickerContent props — popover container for the calendar */
export interface DatePickerContentProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">,
		BaseProps {
	children?: Snippet;
}

// =============================================================================
// CALENDAR PROPS
// =============================================================================

/** DatePickerCalendar props — embedded calendar within the popover */
export interface DatePickerCalendarProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">,
		BaseProps {
	children?: Snippet;
}
