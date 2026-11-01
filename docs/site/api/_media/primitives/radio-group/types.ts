/**
 * @file primitives/radio-group/types.ts
 * @kind radio-group
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Radio group primitive type declarations — structural props, slot/state vocabularies.
 * Lives WITH the implementation per ColdLight architecture (locked 2026-02-21).
 *
 * ariaStateProvider: "meltui" — MeltUI adapter owns ARIA via transport chain.
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/radio/
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes, HTMLButtonAttributes } from "svelte/elements";
import type { StateToken, SlotStateMap } from "../_schema/types.js";
import type { BaseProps } from "../types.js";

// =============================================================================
// SLOT VOCABULARY
// =============================================================================

/** Slot names for the radio-group primitive */
export const radioGroupSlots = ["root", "item"] as const;
export type RadioGroupSlot = (typeof radioGroupSlots)[number];

// =============================================================================
// STATE VOCABULARY
// =============================================================================

/** State tokens applicable to the radio-group primitive */
export const radioGroupStateTokens = [
	"checked",
	"focused",
	"focus-visible",
	"hover",
	"disabled",
] as const satisfies readonly StateToken[];
export type RadioGroupState = (typeof radioGroupStateTokens)[number];

// =============================================================================
// SLOT STATE MAP
// =============================================================================

/** Maps each radio-group slot to its allowed state tokens */
export const radioGroupSlotStates = {
	root: [],
	item: ["checked", "focused", "focus-visible", "hover", "disabled"],
} as const satisfies SlotStateMap<RadioGroupSlot, RadioGroupState>;

// =============================================================================
// COMPONENT PROPS — structural shell only
// =============================================================================

/**
 * RadioGroupRootProps — props for the radio group root container.
 *
 * Zero ARIA. Zero state logic. Zero styling.
 * The component layer applies ARIA + data-state + recipe classes.
 * The `class` prop receives recipe-generated strings from the component layer.
 */
export interface RadioGroupRootProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">, BaseProps {
	children?: Snippet;
}

/**
 * RadioGroupItemProps — props for an individual radio item.
 *
 * Parameterized via getItem builder in MeltUI adapter.
 */
export interface RadioGroupItemProps extends Omit<HTMLButtonAttributes, "style" | "children">, BaseProps {
	/** Value associated with this radio item */
	value: string;
	children?: Snippet;
}
