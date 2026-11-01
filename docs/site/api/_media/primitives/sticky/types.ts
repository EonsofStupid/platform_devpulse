/**
 * @file primitives/sticky/types.ts
 * @kind sticky
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Sticky primitive — Sticky positioning wrapper for fixed-scroll elements.
 * ariaStateProvider: "coldlight"
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { StateToken, SlotStateMap } from "../_schema/types.js";
import type { BaseProps } from "../types.js";

// =============================================================================
// SLOT VOCABULARY
// =============================================================================

/** Slot names for the sticky primitive */
export const stickySlots = ["root"] as const;
export type StickySlot = (typeof stickySlots)[number];

// =============================================================================
// STATE VOCABULARY
// =============================================================================

/** State tokens applicable to the sticky primitive */
export const stickyStateTokens = [] as const satisfies readonly StateToken[];
export type StickyState = (typeof stickyStateTokens)[number];

// =============================================================================
// SLOT STATE MAP
// =============================================================================

/** Maps each sticky slot to its allowed state tokens */
export const stickySlotStates = {
	root: [],
} as const satisfies SlotStateMap<StickySlot, StickyState>;

// =============================================================================
// COMPONENT PROPS — structural shell only
// =============================================================================

/**
 * StickyProps — props for the sticky primitive.
 *
 * Zero ARIA. Zero state logic. Zero styling.
 * The component layer applies ARIA + data-state + recipe classes.
 * The `class` prop receives recipe-generated strings from the component layer.
 */
export interface StickyProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">, BaseProps {
	children?: Snippet;
}
