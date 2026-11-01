/**
 * @file primitives/kbd/types.ts
 * @kind kbd
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Kbd primitive — Keyboard key indicator for keyboard shortcuts.
 * ariaStateProvider: "coldlight"
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { StateToken, SlotStateMap } from "../_schema/types.js";
import type { BaseProps } from "../types.js";

// =============================================================================
// SLOT VOCABULARY
// =============================================================================

/** Slot names for the kbd primitive */
export const kbdSlots = ["root"] as const;
export type KbdSlot = (typeof kbdSlots)[number];

// =============================================================================
// STATE VOCABULARY
// =============================================================================

/** State tokens applicable to the kbd primitive */
export const kbdStateTokens = [] as const satisfies readonly StateToken[];
export type KbdState = (typeof kbdStateTokens)[number];

// =============================================================================
// SLOT STATE MAP
// =============================================================================

/** Maps each kbd slot to its allowed state tokens */
export const kbdSlotStates = {
	root: [],
} as const satisfies SlotStateMap<KbdSlot, KbdState>;

// =============================================================================
// COMPONENT PROPS — structural shell only
// =============================================================================

/**
 * KbdProps — props for the kbd primitive.
 *
 * Zero ARIA. Zero state logic. Zero styling.
 * The component layer applies ARIA + data-state + recipe classes.
 * The `class` prop receives recipe-generated strings from the component layer.
 */
export interface KbdProps extends Omit<HTMLAttributes<HTMLElement>, "style" | "children">, BaseProps {
	children?: Snippet;
}
