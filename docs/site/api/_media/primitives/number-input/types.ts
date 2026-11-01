/**
 * @file primitives/number-input/types.ts
 * @kind number-input
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Number-input primitive type declarations — structural props, slot/state vocabularies.
 * Lives WITH the implementation per ColdLight architecture.
 *
 * ariaStateProvider: "coldlight" — ColdLight owns ARIA. This primitive is zero-ARIA.
 * ARIA is applied by the component layer (components/number-input/).
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { StateToken, SlotStateMap } from "../_schema/types.js";
import type { BaseProps } from "../types.js";

// =============================================================================
// SLOT VOCABULARY
// =============================================================================

/** Slot names for the number-input primitive */
export const numberInputSlots = ["root", "input", "increment", "decrement"] as const;
export type NumberInputSlot = (typeof numberInputSlots)[number];

// =============================================================================
// STATE VOCABULARY
// =============================================================================

/** State tokens applicable to the number-input primitive */
export const numberInputStateTokens = [
	"focused",
	"focus-visible",
	"hover",
	"disabled",
] as const satisfies readonly StateToken[];
export type NumberInputState = (typeof numberInputStateTokens)[number];

// =============================================================================
// SLOT STATE MAP
// =============================================================================

/** Maps each number-input slot to its allowed state tokens */
export const numberInputSlotStates = {
	root: ["disabled"],
	input: ["focused", "focus-visible", "disabled"],
	increment: ["hover", "disabled"],
	decrement: ["hover", "disabled"],
} as const satisfies SlotStateMap<NumberInputSlot, NumberInputState>;

// =============================================================================
// COMPONENT PROPS — structural shell only
// =============================================================================

/**
 * NumberInputRootProps — props for the number-input root primitive.
 *
 * Zero ARIA. Zero state logic. Zero styling.
 * The component layer applies ARIA + data-state + recipe classes.
 */
export interface NumberInputRootProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">, BaseProps {
	children?: Snippet;
}
