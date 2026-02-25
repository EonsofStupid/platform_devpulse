/**
 * @file primitives/stat/types.ts
 * @kind stat
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Stat primitive type declarations — structural props, slot/state vocabularies.
 * Lives WITH the implementation per ColdLight architecture.
 *
 * ariaStateProvider: "coldlight" — ColdLight owns ARIA. This primitive is zero-ARIA.
 * ARIA is applied by the component layer (components/stat/).
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { StateToken, SlotStateMap } from "../_schema/types.js";
import type { BaseProps } from "../types.js";

// =============================================================================
// SLOT VOCABULARY
// =============================================================================

/** Slot names for the stat primitive */
export const statSlots = ["root", "label", "value", "delta", "icon"] as const;
export type StatSlot = (typeof statSlots)[number];

// =============================================================================
// STATE VOCABULARY
// =============================================================================

/** State tokens applicable to the stat primitive */
export const statStateTokens = [] as const satisfies readonly StateToken[];
export type StatState = (typeof statStateTokens)[number];

// =============================================================================
// SLOT STATE MAP
// =============================================================================

/** Maps each stat slot to its allowed state tokens */
export const statSlotStates = {
	root: [],
	label: [],
	value: [],
	delta: [],
	icon: [],
} as const satisfies SlotStateMap<StatSlot, StatState>;

// =============================================================================
// COMPONENT PROPS — structural shell only
// =============================================================================

/**
 * StatProps — props for the structureless stat primitive.
 *
 * Zero ARIA. Zero state logic. Zero styling.
 * The component layer (components/stat/) applies ARIA + data-state + recipe classes.
 * The `class` prop receives recipe-generated strings from the component layer.
 */
export interface StatProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">, BaseProps {
	children?: Snippet;
}
