/**
 * @file primitives/calendar/types.ts
 * @kind calendar
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Calendar primitive — grid-based date selection widget.
 * ariaStateProvider: "meltui" — MeltUI adapter handles ARIA via new Calendar().
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

/** Slot names for the calendar primitive */
export const calendarSlots = [
	"root",
	"header",
	"grid",
	"heading",
	"cell",
	"prev-button",
	"next-button",
] as const;
export type CalendarSlot = (typeof calendarSlots)[number];

// =============================================================================
// STATE VOCABULARY
// =============================================================================

/** State tokens applicable to the calendar primitive */
export const calendarStateTokens = [
	"focused",
	"focus-visible",
	"hover",
	"disabled",
	"selected",
] as const satisfies readonly StateToken[];
export type CalendarState = (typeof calendarStateTokens)[number];

// =============================================================================
// SLOT STATE MAP
// =============================================================================

/** Maps each calendar slot to its allowed state tokens */
export const calendarSlotStates = {
	root: [],
	header: [],
	grid: [],
	heading: [],
	cell: ["selected", "focused", "focus-visible", "hover", "disabled"],
	"prev-button": ["focused", "focus-visible", "disabled"],
	"next-button": ["focused", "focus-visible", "disabled"],
} as const satisfies SlotStateMap<CalendarSlot, CalendarState>;

// =============================================================================
// COMPONENT PROPS — structural shell only
// =============================================================================

/** Props for the calendar root slot */
export interface CalendarRootProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">,
		BaseProps {
	children?: Snippet;
}

/** Props for the calendar cell slot */
export interface CalendarCellProps
	extends Omit<HTMLButtonAttributes, "style" | "children">,
		BaseProps {
	children?: Snippet;
}

/** Props for the calendar prev-button slot */
export interface CalendarPrevButtonProps
	extends Omit<HTMLButtonAttributes, "style" | "children">,
		BaseProps {
	children?: Snippet;
}

/** Props for the calendar next-button slot */
export interface CalendarNextButtonProps
	extends Omit<HTMLButtonAttributes, "style" | "children">,
		BaseProps {
	children?: Snippet;
}
