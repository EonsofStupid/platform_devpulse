/**
 * @file primitives/center/types.ts
 * @kind center
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Center primitive type declarations — structural props, slot/state vocabularies.
 * Lives WITH the implementation per ColdLight architecture.
 *
 * ariaStateProvider: "coldlight" — ColdLight owns ARIA. This primitive is zero-ARIA.
 * ARIA is applied by the component layer (components/center/).
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { StateToken, SlotStateMap } from "../_schema/types.js";
import type { BaseProps } from "../types.js";

// =============================================================================
// SLOT VOCABULARY
// =============================================================================

/** Slot names for the center primitive */
export const centerSlots = ["root"] as const;
export type CenterSlot = (typeof centerSlots)[number];

// =============================================================================
// STATE VOCABULARY
// =============================================================================

/** State tokens applicable to the center primitive */
export const centerStateTokens = [] as const satisfies readonly StateToken[];
export type CenterState = (typeof centerStateTokens)[number];

// =============================================================================
// SLOT STATE MAP
// =============================================================================

/** Maps each center slot to its allowed state tokens */
export const centerSlotStates = {
	root: [],
} as const satisfies SlotStateMap<CenterSlot, CenterState>;

// =============================================================================
// COMPONENT PROPS — structural shell only
// =============================================================================

/**
 * CenterProps — props for the structureless center primitive.
 *
 * Zero ARIA. Zero state logic. Zero styling.
 * The component layer (components/center/) applies ARIA + data-state + recipe classes.
 * The `class` prop receives recipe-generated strings from the component layer.
 */
export interface CenterProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">, BaseProps {
	children?: Snippet;
}
