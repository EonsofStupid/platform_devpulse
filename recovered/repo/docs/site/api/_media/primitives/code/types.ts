/**
 * @file primitives/code/types.ts
 * @kind code
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Code primitive type declarations — structural props, slot/state vocabularies.
 * Lives WITH the implementation per ColdLight architecture.
 *
 * ariaStateProvider: "coldlight" — ColdLight owns ARIA. This primitive is zero-ARIA.
 * ARIA is applied by the component layer (components/code/).
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { StateToken, SlotStateMap } from "../_schema/types.js";
import type { BaseProps } from "../types.js";

// =============================================================================
// SLOT VOCABULARY
// =============================================================================

/** Slot names for the code primitive */
export const codeSlots = ["root"] as const;
export type CodeSlot = (typeof codeSlots)[number];

// =============================================================================
// STATE VOCABULARY
// =============================================================================

/** State tokens applicable to the code primitive */
export const codeStateTokens = [] as const satisfies readonly StateToken[];
export type CodeState = (typeof codeStateTokens)[number];

// =============================================================================
// SLOT STATE MAP
// =============================================================================

/** Maps each code slot to its allowed state tokens */
export const codeSlotStates = {
	root: [],
} as const satisfies SlotStateMap<CodeSlot, CodeState>;

// =============================================================================
// COMPONENT PROPS — structural shell only
// =============================================================================

/**
 * CodeProps — props for the structureless code primitive.
 *
 * Zero ARIA. Zero state logic. Zero styling.
 * The component layer (components/code/) applies ARIA + data-state + recipe classes.
 * The `class` prop receives recipe-generated strings from the component layer.
 */
export interface CodeProps extends Omit<HTMLAttributes<HTMLElement>, "style" | "children">, BaseProps {
	children?: Snippet;
}
