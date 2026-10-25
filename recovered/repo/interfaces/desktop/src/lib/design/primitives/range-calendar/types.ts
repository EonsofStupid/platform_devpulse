/**
 * @file primitives/range-calendar/types.ts
 * @kind range-calendar
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Range calendar primitive — grid-based date range selection widget.
 * ariaStateProvider: "meltui" — MeltUI adapter handles ARIA via new RangeCalendar().
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/grid/
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes, HTMLButtonAttributes } from "svelte/elements";
import type { StateToken, SlotStateMap } from "../_schema/types.js";
import type { BaseProps } from "../types.js";

// =============================================================================
// SLOT VOCABULARY
// =============================================================================

/** Slot names for the range-calendar primitive */
export const rangeCalendarSlots = [
	"root",
	"header",
	"grid",
	"heading",
	"cell",
	"prev-button",
	"next-button",
] as const;
export type RangeCalendarSlot = (typeof rangeCalendarSlots)[number];

// =============================================================================
// STATE VOCABULARY
// =============================================================================

/** State tokens applicable to the range-calendar primitive */
export const rangeCalendarStateTokens = [
	"focused",
	"focus-visible",
	"hover",
	"disabled",
	"selected",
] as const satisfies readonly StateToken[];
export type RangeCalendarState = (typeof rangeCalendarStateTokens)[number];

// =============================================================================
// SLOT STATE MAP
// =============================================================================

/** Maps each range-calendar slot to its allowed state tokens */
export const rangeCalendarSlotStates = {
	root: [],
	header: [],
	grid: [],
	heading: [],
	cell: ["selected", "focused", "focus-visible", "hover", "disabled"],
	"prev-button": ["focused", "focus-visible", "disabled"],
	"next-button": ["focused", "focus-visible", "disabled"],
} as const satisfies SlotStateMap<RangeCalendarSlot, RangeCalendarState>;

// =============================================================================
// COMPONENT PROPS — structural shell only
// =============================================================================

/** Props for the range-calendar root slot */
export interface RangeCalendarRootProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">,
		BaseProps {
	children?: Snippet;
}

/** Props for the range-calendar cell slot */
export interface RangeCalendarCellProps
	extends Omit<HTMLButtonAttributes, "style" | "children">,
		BaseProps {
	children?: Snippet;
}

/** Props for the range-calendar prev-button slot */
export interface RangeCalendarPrevButtonProps
	extends Omit<HTMLButtonAttributes, "style" | "children">,
		BaseProps {
	children?: Snippet;
}

/** Props for the range-calendar next-button slot */
export interface RangeCalendarNextButtonProps
	extends Omit<HTMLButtonAttributes, "style" | "children">,
		BaseProps {
	children?: Snippet;
}
