/**
 * @file primitives/date-range-field/types.ts
 * @kind date-range-field
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Date range field primitive — two segmented date fields for range input.
 * ariaStateProvider: "meltui" — MeltUI adapter handles ARIA via new DateRangeField().
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/spinbutton/
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { StateToken, SlotStateMap } from "../_schema/types.js";
import type { BaseProps } from "../types.js";

// =============================================================================
// SLOT VOCABULARY
// =============================================================================

/** Slot names for the date-range-field primitive */
export const dateRangeFieldSlots = [
	"root",
	"start-segment",
	"end-segment",
	"label",
	"separator",
] as const;
export type DateRangeFieldSlot = (typeof dateRangeFieldSlots)[number];

// =============================================================================
// STATE VOCABULARY
// =============================================================================

/** State tokens applicable to the date-range-field primitive */
export const dateRangeFieldStateTokens = [
	"focused",
	"focus-visible",
	"disabled",
	"invalid",
	"readonly",
] as const satisfies readonly StateToken[];
export type DateRangeFieldState = (typeof dateRangeFieldStateTokens)[number];

// =============================================================================
// SLOT STATE MAP
// =============================================================================

/** Maps each date-range-field slot to its allowed state tokens */
export const dateRangeFieldSlotStates = {
	root: ["focused", "focus-visible", "disabled", "invalid", "readonly"],
	"start-segment": ["focused", "focus-visible", "disabled", "readonly"],
	"end-segment": ["focused", "focus-visible", "disabled", "readonly"],
	label: [],
	separator: [],
} as const satisfies SlotStateMap<DateRangeFieldSlot, DateRangeFieldState>;

// =============================================================================
// COMPONENT PROPS — structural shell only
// =============================================================================

/** Props for the date-range-field root slot */
export interface DateRangeFieldRootProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">,
		BaseProps {
	children?: Snippet;
}

/** Props for the date-range-field segment slots (start and end) */
export interface DateRangeFieldSegmentProps
	extends Omit<HTMLAttributes<HTMLSpanElement>, "style" | "children">,
		BaseProps {
	children?: Snippet;
}

/** Props for the date-range-field label slot */
export interface DateRangeFieldLabelProps
	extends Omit<HTMLAttributes<HTMLLabelElement>, "style" | "children">,
		BaseProps {
	children?: Snippet;
}
