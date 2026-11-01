/**
 * @file primitives/nav-item/types.ts
 * @kind nav-item
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Nav-item primitive type declarations — structural props, slot/state vocabularies.
 * Lives WITH the implementation per ColdLight architecture.
 *
 * ariaStateProvider: "coldlight" — ColdLight owns ARIA. This primitive is zero-ARIA.
 * ARIA is applied by the component layer (components/nav-item/).
 */

import type { Snippet } from "svelte";
import type { HTMLAnchorAttributes } from "svelte/elements";
import type { StateToken, SlotStateMap } from "../_schema/types.js";
import type { BaseProps } from "../types.js";

// =============================================================================
// SLOT VOCABULARY
// =============================================================================

/** Slot names for the nav-item primitive */
export const navItemSlots = ["root"] as const;
export type NavItemSlot = (typeof navItemSlots)[number];

// =============================================================================
// STATE VOCABULARY
// =============================================================================

/** State tokens applicable to the nav-item primitive */
export const navItemStateTokens = [
	"active",
	"focused",
	"focus-visible",
	"hover",
	"disabled",
] as const satisfies readonly StateToken[];
export type NavItemState = (typeof navItemStateTokens)[number];

// =============================================================================
// SLOT STATE MAP
// =============================================================================

/** Maps each nav-item slot to its allowed state tokens */
export const navItemSlotStates = {
	root: ["active", "focused", "focus-visible", "hover", "disabled"],
} as const satisfies SlotStateMap<NavItemSlot, NavItemState>;

// =============================================================================
// COMPONENT PROPS — structural shell only
// =============================================================================

/**
 * NavItemProps — props for the structureless nav-item primitive.
 *
 * Zero ARIA. Zero state logic. Zero styling.
 * The component layer (components/nav-item/) applies ARIA + data-state + recipe classes.
 * The `class` prop receives recipe-generated strings from the component layer.
 */
export interface NavItemProps extends Omit<HTMLAnchorAttributes, "style" | "children">, BaseProps {
	children?: Snippet;
}
