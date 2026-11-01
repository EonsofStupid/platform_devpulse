/**
 * @file primitives/prose/types.ts
 * @kind prose
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Prose primitive — Rich text content container with typographic styling.
 * ariaStateProvider: "coldlight"
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { StateToken, SlotStateMap } from "../_schema/types.js";
import type { BaseProps } from "../types.js";

// =============================================================================
// SLOT VOCABULARY
// =============================================================================

/** Slot names for the prose primitive */
export const proseSlots = ["root"] as const;
export type ProseSlot = (typeof proseSlots)[number];

// =============================================================================
// STATE VOCABULARY
// =============================================================================

/** State tokens applicable to the prose primitive */
export const proseStateTokens = [] as const satisfies readonly StateToken[];
export type ProseState = (typeof proseStateTokens)[number];

// =============================================================================
// SLOT STATE MAP
// =============================================================================

/** Maps each prose slot to its allowed state tokens */
export const proseSlotStates = {
	root: [],
} as const satisfies SlotStateMap<ProseSlot, ProseState>;

// =============================================================================
// COMPONENT PROPS — structural shell only
// =============================================================================

/**
 * ProseProps — props for the prose primitive.
 *
 * Zero ARIA. Zero state logic. Zero styling.
 * The component layer applies ARIA + data-state + recipe classes.
 * The `class` prop receives recipe-generated strings from the component layer.
 */
export interface ProseProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">, BaseProps {
	children?: Snippet;
}
