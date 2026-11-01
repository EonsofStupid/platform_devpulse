/**
 * @file primitives/nav/types.ts
 * @kind nav
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Nav primitive type declarations — structural props, slot/state vocabularies.
 * Lives WITH the implementation per ColdLight architecture.
 *
 * ariaStateProvider: "coldlight" — ColdLight owns ARIA. This primitive is zero-ARIA.
 * ARIA is applied by the component layer (components/nav/).
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { StateToken, SlotStateMap } from "../_schema/types.js";
import type { BaseProps } from "../types.js";

// =============================================================================
// SLOT VOCABULARY
// =============================================================================

/** Slot names for the nav primitive */
export const navSlots = ["root"] as const;
export type NavSlot = (typeof navSlots)[number];

// =============================================================================
// STATE VOCABULARY
// =============================================================================

/** State tokens applicable to the nav primitive (none) */
export const navStateTokens = [] as const satisfies readonly StateToken[];
export type NavState = (typeof navStateTokens)[number];

// =============================================================================
// SLOT STATE MAP
// =============================================================================

/** Maps each nav slot to its allowed state tokens */
export const navSlotStates = {
	root: [],
} as const satisfies SlotStateMap<NavSlot, NavState>;

// =============================================================================
// COMPONENT PROPS — structural shell only
// =============================================================================

/**
 * NavProps — props for the structureless nav primitive.
 *
 * Zero ARIA. Zero state logic. Zero styling.
 * The component layer (components/nav/) applies ARIA + data-state + recipe classes.
 * The `class` prop receives recipe-generated strings from the component layer.
 */
export interface NavProps extends Omit<HTMLAttributes<HTMLElement>, "style" | "children">, BaseProps {
	children?: Snippet;
}
