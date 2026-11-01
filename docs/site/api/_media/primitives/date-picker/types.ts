/**
 * @file primitives/date-picker/types.ts
 * @kind date-picker
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Date picker primitive — combined date field + calendar popup for date selection.
 * ariaStateProvider: "meltui" — MeltUI adapter handles ARIA via new DatePicker().
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes, HTMLButtonAttributes } from "svelte/elements";
import type { StateToken, SlotStateMap } from "../_schema/types.js";
import type { BaseProps } from "../types.js";

// =============================================================================
// SLOT VOCABULARY
// =============================================================================

/** Slot names for the date-picker primitive */
export const datePickerSlots = [
	"root",
	"field",
	"trigger",
	"content",
	"calendar",
	"label",
] as const;
export type DatePickerSlot = (typeof datePickerSlots)[number];

// =============================================================================
// STATE VOCABULARY
// =============================================================================

/** State tokens applicable to the date-picker primitive */
export const datePickerStateTokens = [
	"focused",
	"focus-visible",
	"disabled",
	"invalid",
	"open",
	"closed",
] as const satisfies readonly StateToken[];
export type DatePickerState = (typeof datePickerStateTokens)[number];

// =============================================================================
// SLOT STATE MAP
// =============================================================================

/** Maps each date-picker slot to its allowed state tokens */
export const datePickerSlotStates = {
	root: ["disabled", "invalid"],
	field: ["focused", "focus-visible", "disabled", "invalid"],
	trigger: ["focused", "focus-visible", "open", "closed"],
	content: ["open", "closed"],
	calendar: [],
	label: [],
} as const satisfies SlotStateMap<DatePickerSlot, DatePickerState>;

// =============================================================================
// COMPONENT PROPS — structural shell only
// =============================================================================

/** Props for the date-picker root slot */
export interface DatePickerRootProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">,
		BaseProps {
	children?: Snippet;
}

/** Props for the date-picker field slot */
export interface DatePickerFieldProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">,
		BaseProps {
	children?: Snippet;
}

/** Props for the date-picker trigger slot */
export interface DatePickerTriggerProps
	extends Omit<HTMLButtonAttributes, "style" | "children">,
		BaseProps {
	children?: Snippet;
}

/** Props for the date-picker content slot */
export interface DatePickerContentProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">,
		BaseProps {
	children?: Snippet;
}
