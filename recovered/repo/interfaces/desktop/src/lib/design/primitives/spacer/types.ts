/**
 * @file primitives/spacer/types.ts
 * @kind spacer
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Spacer primitive type declarations — structural props, slot/state vocabularies.
 * Lives WITH the implementation per ColdLight architecture.
 *
 * ariaStateProvider: "coldlight" — ColdLight owns ARIA. This primitive is zero-ARIA.
 * ARIA is applied by the component layer (components/spacer/).
 */

import type { HTMLAttributes } from "svelte/elements";
import type { StateToken, SlotStateMap } from "../_schema/types.js";
import type { BaseProps } from "../types.js";

// =============================================================================
// SLOT VOCABULARY
// =============================================================================

/** Slot names for the spacer primitive */
export const spacerSlots = ["root"] as const;
export type SpacerSlot = (typeof spacerSlots)[number];

// =============================================================================
// STATE VOCABULARY
// =============================================================================

/** State tokens applicable to the spacer primitive */
export const spacerStateTokens = [] as const satisfies readonly StateToken[];
export type SpacerState = (typeof spacerStateTokens)[number];

// =============================================================================
// SLOT STATE MAP
// =============================================================================

/** Maps each spacer slot to its allowed state tokens */
export const spacerSlotStates = {
	root: [],
} as const satisfies SlotStateMap<SpacerSlot, SpacerState>;

// =============================================================================
// COMPONENT PROPS — structural shell only
// =============================================================================

/**
 * SpacerProps — props for the structureless spacer primitive.
 *
 * Zero ARIA. Zero state logic. Zero styling.
 * The component layer (components/spacer/) applies ARIA + data-state + recipe classes.
 * The `class` prop receives recipe-generated strings from the component layer.
 * No children — spacer is a self-closing presentational element.
 */
export interface SpacerProps extends Omit<HTMLAttributes<HTMLDivElement>, "style">, BaseProps {}
