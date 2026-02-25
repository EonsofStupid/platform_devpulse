/**
 * @file primitives/input-group/types.ts
 * @kind input-group
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Input-group primitive type declarations — structural props, slot/state vocabularies.
 * Lives WITH the implementation per ColdLight architecture.
 *
 * ariaStateProvider: "coldlight" — ColdLight owns ARIA. This primitive is zero-ARIA.
 * ARIA is applied by the component layer (components/input-group/).
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { StateToken, SlotStateMap } from "../_schema/types.js";
import type { BaseProps } from "../types.js";

// =============================================================================
// SLOT VOCABULARY
// =============================================================================

/** Slot names for the input-group primitive */
export const inputGroupSlots = ["root", "prefix", "input", "suffix"] as const;
export type InputGroupSlot = (typeof inputGroupSlots)[number];

// =============================================================================
// STATE VOCABULARY
// =============================================================================

/** State tokens applicable to the input-group primitive */
export const inputGroupStateTokens = [
	"focused",
	"focus-visible",
	"disabled",
] as const satisfies readonly StateToken[];
export type InputGroupState = (typeof inputGroupStateTokens)[number];

// =============================================================================
// SLOT STATE MAP
// =============================================================================

/** Maps each input-group slot to its allowed state tokens */
export const inputGroupSlotStates = {
	root: ["focused", "focus-visible", "disabled"],
	prefix: [],
	input: ["focused", "focus-visible", "disabled"],
	suffix: [],
} as const satisfies SlotStateMap<InputGroupSlot, InputGroupState>;

// =============================================================================
// COMPONENT PROPS — structural shell only
// =============================================================================

/**
 * InputGroupProps — props for the input-group root primitive.
 *
 * Zero ARIA. Zero state logic. Zero styling.
 * The component layer applies ARIA + data-state + recipe classes.
 */
export interface InputGroupProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">, BaseProps {
	children?: Snippet;
}
