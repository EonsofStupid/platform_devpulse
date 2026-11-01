/**
 * @file primitives/toggle-group/types.ts
 * @kind toggle-group
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Toggle-group primitive type declarations — structural props, slot/state vocabularies.
 * Lives WITH the implementation per ColdLight architecture.
 *
 * ariaStateProvider: "coldlight" — ColdLight owns ARIA. This primitive is zero-ARIA.
 * ARIA is applied by the component layer (components/toggle-group/).
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/ (toggle group pattern)
 */

import type { Snippet } from "svelte";
import type { HTMLButtonAttributes } from "svelte/elements";
import type { HTMLAttributes } from "svelte/elements";
import type { StateToken, SlotStateMap } from "../_schema/types.js";
import type { BaseProps } from "../types.js";

// =============================================================================
// SLOT VOCABULARY
// =============================================================================

/** Slot names for the toggle-group primitive */
export const toggleGroupSlots = ["root", "item"] as const;
export type ToggleGroupSlot = (typeof toggleGroupSlots)[number];

// =============================================================================
// STATE VOCABULARY
// =============================================================================

/** State tokens applicable to the toggle-group primitive */
export const toggleGroupStateTokens = [
	"pressed",
	"focused",
	"focus-visible",
	"hover",
	"disabled",
] as const satisfies readonly StateToken[];
export type ToggleGroupState = (typeof toggleGroupStateTokens)[number];

// =============================================================================
// SLOT STATE MAP
// =============================================================================

/** Maps each toggle-group slot to its allowed state tokens */
export const toggleGroupSlotStates = {
	root: [],
	item: ["pressed", "focused", "focus-visible", "hover", "disabled"],
} as const satisfies SlotStateMap<ToggleGroupSlot, ToggleGroupState>;

// =============================================================================
// COMPONENT PROPS — structural shell only
// =============================================================================

/**
 * ToggleGroupRootProps — props for the toggle-group root primitive.
 *
 * Zero ARIA. Zero state logic. Zero styling.
 * The component layer applies ARIA + data-state + recipe classes.
 */
export interface ToggleGroupRootProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">, BaseProps {
	children?: Snippet;
}

/**
 * ToggleGroupItemProps — props for each toggle-group item primitive.
 *
 * Zero ARIA. Zero state logic. Zero styling.
 * The component layer applies ARIA + data-state + recipe classes.
 */
export interface ToggleGroupItemProps extends Omit<HTMLButtonAttributes, "style" | "children">, BaseProps {
	children?: Snippet;
	value: string;
}
