/**
 * @file primitives/steps/types.ts
 * @kind steps
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Steps primitive type declarations — structural props, slot/state vocabularies.
 * Lives WITH the implementation per ColdLight architecture.
 *
 * ariaStateProvider: "coldlight" — ColdLight owns ARIA. This primitive is zero-ARIA.
 * ARIA is applied by the component layer (components/steps/).
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { StateToken, SlotStateMap } from "../_schema/types.js";
import type { BaseProps } from "../types.js";

// =============================================================================
// SLOT VOCABULARY
// =============================================================================

/** Slot names for the steps primitive */
export const stepsSlots = ["root", "step"] as const;
export type StepsSlot = (typeof stepsSlots)[number];

// =============================================================================
// STATE VOCABULARY
// =============================================================================

/** State tokens applicable to the steps primitive */
export const stepsStateTokens = [
	"active",
	"disabled",
] as const satisfies readonly StateToken[];
export type StepsState = (typeof stepsStateTokens)[number];

// =============================================================================
// SLOT STATE MAP
// =============================================================================

/** Maps each steps slot to its allowed state tokens */
export const stepsSlotStates = {
	root: [],
	step: ["active", "disabled"],
} as const satisfies SlotStateMap<StepsSlot, StepsState>;

// =============================================================================
// COMPONENT PROPS — structural shell only
// =============================================================================

/**
 * StepsProps — props for the structureless steps primitive.
 *
 * Zero ARIA. Zero state logic. Zero styling.
 * The component layer (components/steps/) applies ARIA + data-state + recipe classes.
 * The `class` prop receives recipe-generated strings from the component layer.
 */
export interface StepsProps extends Omit<HTMLAttributes<HTMLElement>, "style" | "children">, BaseProps {
	children?: Snippet;
}
