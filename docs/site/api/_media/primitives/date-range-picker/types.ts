/**
 * @file primitives/date-range-picker/types.ts
 * @kind date-range-picker
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Date range picker primitive — combined range field + calendar popup for range selection.
 * ariaStateProvider: "meltui" — MeltUI adapter handles ARIA via new DateRangePicker().
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

/** Slot names for the date-range-picker primitive */
export const dateRangePickerSlots = [
	"root",
	"start-field",
	"end-field",
	"trigger",
	"content",
	"calendar",
	"label",
] as const;
export type DateRangePickerSlot = (typeof dateRangePickerSlots)[number];

// =============================================================================
// STATE VOCABULARY
// =============================================================================

/** State tokens applicable to the date-range-picker primitive */
export const dateRangePickerStateTokens = [
	"focused",
	"focus-visible",
	"disabled",
	"invalid",
	"open",
	"closed",
] as const satisfies readonly StateToken[];
export type DateRangePickerState = (typeof dateRangePickerStateTokens)[number];

// =============================================================================
// SLOT STATE MAP
// =============================================================================

/** Maps each date-range-picker slot to its allowed state tokens */
export const dateRangePickerSlotStates = {
	root: ["disabled", "invalid"],
	"start-field": ["focused", "focus-visible", "disabled", "invalid"],
	"end-field": ["focused", "focus-visible", "disabled", "invalid"],
	trigger: ["focused", "focus-visible", "open", "closed"],
	content: ["open", "closed"],
	calendar: [],
	label: [],
} as const satisfies SlotStateMap<DateRangePickerSlot, DateRangePickerState>;

// =============================================================================
// COMPONENT PROPS — structural shell only
// =============================================================================

/** Props for the date-range-picker root slot */
export interface DateRangePickerRootProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">,
		BaseProps {
	children?: Snippet;
}

/** Props for the date-range-picker trigger slot */
export interface DateRangePickerTriggerProps
	extends Omit<HTMLButtonAttributes, "style" | "children">,
		BaseProps {
	children?: Snippet;
}

/** Props for the date-range-picker content slot */
export interface DateRangePickerContentProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">,
		BaseProps {
	children?: Snippet;
}
