/**
 * @file primitives/button/types.ts
 * @kind button
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Button primitive type declarations — structural props, slot/state vocabularies.
 * Lives WITH the implementation per ColdLight architecture (locked 2026-02-21).
 *
 * ariaStateProvider: "coldlight" — ColdLight owns ARIA. This primitive is zero-ARIA.
 * ARIA is applied by the component layer (components/button/).
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/button/
 */

import type { Snippet } from "svelte";
import type { HTMLButtonAttributes } from "svelte/elements";
import type { StateToken, SlotStateMap } from "../../taxonomy/kinds/primitives/types.js";
import type { BaseProps } from "../types.js";

// =============================================================================
// SLOT VOCABULARY
// =============================================================================

/** Slot names for the button primitive */
export const buttonSlots = ["root", "icon", "label"] as const;
export type ButtonSlot = (typeof buttonSlots)[number];

// =============================================================================
// STATE VOCABULARY
// =============================================================================

/** State tokens applicable to the button primitive */
export const buttonStateTokens = [
	"focused",
	"focus-visible",
	"hover",
	"active",
	"disabled",
	"pressed",
	"loading",
	"busy",
] as const satisfies readonly StateToken[];
export type ButtonState = (typeof buttonStateTokens)[number];

// =============================================================================
// SLOT STATE MAP
// =============================================================================

/** Maps each button slot to its allowed state tokens */
export const buttonSlotStates = {
	root: ["focused", "focus-visible", "hover", "active", "disabled", "pressed", "loading", "busy"],
	icon: [],
	label: [],
} as const satisfies SlotStateMap<ButtonSlot, ButtonState>;

// =============================================================================
// HTML BUTTON TYPE
// =============================================================================

export type ButtonType = "button" | "submit" | "reset";

// =============================================================================
// COMPONENT PROPS — structural shell only
// =============================================================================

/**
 * ButtonRootProps — props for the structureless button primitive.
 *
 * Zero ARIA. Zero state logic. Zero styling.
 * The component layer (components/button/) applies ARIA + data-state + recipe classes.
 * The `class` prop receives recipe-generated strings from the component layer.
 */
export interface ButtonRootProps extends Omit<HTMLButtonAttributes, "style" | "children">, BaseProps {
	children?: Snippet;
}
