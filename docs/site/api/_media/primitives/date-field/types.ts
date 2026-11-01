/**
 * @file primitives/date-field/types.ts
 * @kind date-field
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Date field primitive — segmented date input fields with spinbutton segments.
 * ariaStateProvider: "meltui" — MeltUI adapter handles ARIA via new DateField().
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

/** Slot names for the date-field primitive */
export const dateFieldSlots = ["root", "segment", "label"] as const;
export type DateFieldSlot = (typeof dateFieldSlots)[number];

// =============================================================================
// STATE VOCABULARY
// =============================================================================

/** State tokens applicable to the date-field primitive */
export const dateFieldStateTokens = [
	"focused",
	"focus-visible",
	"disabled",
	"invalid",
	"readonly",
] as const satisfies readonly StateToken[];
export type DateFieldState = (typeof dateFieldStateTokens)[number];

// =============================================================================
// SLOT STATE MAP
// =============================================================================

/** Maps each date-field slot to its allowed state tokens */
export const dateFieldSlotStates = {
	root: ["focused", "focus-visible", "disabled", "invalid", "readonly"],
	segment: ["focused", "focus-visible", "disabled", "readonly"],
	label: [],
} as const satisfies SlotStateMap<DateFieldSlot, DateFieldState>;

// =============================================================================
// COMPONENT PROPS — structural shell only
// =============================================================================

/** Props for the date-field root slot */
export interface DateFieldRootProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">,
		BaseProps {
	children?: Snippet;
}

/** Props for the date-field segment slot */
export interface DateFieldSegmentProps
	extends Omit<HTMLAttributes<HTMLSpanElement>, "style" | "children">,
		BaseProps {
	children?: Snippet;
}

/** Props for the date-field label slot */
export interface DateFieldLabelProps
	extends Omit<HTMLAttributes<HTMLLabelElement>, "style" | "children">,
		BaseProps {
	children?: Snippet;
}
