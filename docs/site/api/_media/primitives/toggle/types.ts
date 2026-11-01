/**
 * @file primitives/toggle/types.ts
 * @kind toggle
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Toggle primitive type declarations — structural props, slot/state vocabularies.
 * Lives WITH the implementation per ColdLight architecture (locked 2026-02-21).
 *
 * ariaStateProvider: "meltui" — MeltUI adapter handles ARIA via transport chain.
 */

import type { Snippet } from "svelte";
import type { HTMLButtonAttributes } from "svelte/elements";
import type { StateToken, SlotStateMap } from "../_schema/types.js";
import type { BaseProps } from "../types.js";

// =============================================================================
// SLOT VOCABULARY
// =============================================================================

/** Slot names for the toggle primitive */
export const toggleSlots = ["trigger"] as const;
export type ToggleSlot = (typeof toggleSlots)[number];

// =============================================================================
// STATE VOCABULARY
// =============================================================================

/** State tokens applicable to the toggle primitive */
export const toggleStateTokens = [
	"pressed",
	"focused",
	"focus-visible",
	"hover",
	"disabled",
] as const satisfies readonly StateToken[];
export type ToggleState = (typeof toggleStateTokens)[number];

// =============================================================================
// SLOT STATE MAP
// =============================================================================

/** Maps each toggle slot to its allowed state tokens */
export const toggleSlotStates = {
	trigger: ["pressed", "focused", "focus-visible", "hover", "disabled"],
} as const satisfies SlotStateMap<ToggleSlot, ToggleState>;

// =============================================================================
// COMPONENT PROPS — structural shell only
// =============================================================================

/**
 * ToggleTriggerProps — props for the toggle trigger slot.
 *
 * Zero ARIA. Zero state logic. Zero styling.
 * The component layer applies ARIA + data-state + recipe classes.
 * The `class` prop receives recipe-generated strings from the component layer.
 */
export interface ToggleTriggerProps extends Omit<HTMLButtonAttributes, "style" | "children">, BaseProps {
	children?: Snippet;
}
