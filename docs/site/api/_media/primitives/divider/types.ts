/**
 * @file primitives/divider/types.ts
 * @kind divider
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Divider primitive type declarations — structural props, slot/state vocabularies.
 * Lives WITH the implementation per ColdLight architecture.
 *
 * ariaStateProvider: "coldlight" — ColdLight owns ARIA. This primitive is zero-ARIA.
 * ARIA is applied by the component layer (components/divider/).
 *
 * WAI-ARIA APG: separator role
 */

import type { HTMLAttributes } from "svelte/elements";
import type { StateToken, SlotStateMap } from "../_schema/types.js";
import type { BaseProps } from "../types.js";

// =============================================================================
// SLOT VOCABULARY
// =============================================================================

/** Slot names for the divider primitive */
export const dividerSlots = ["root"] as const;
export type DividerSlot = (typeof dividerSlots)[number];

// =============================================================================
// STATE VOCABULARY
// =============================================================================

/** State tokens applicable to the divider primitive */
export const dividerStateTokens = [] as const satisfies readonly StateToken[];
export type DividerState = (typeof dividerStateTokens)[number];

// =============================================================================
// SLOT STATE MAP
// =============================================================================

/** Maps each divider slot to its allowed state tokens */
export const dividerSlotStates = {
	root: [],
} as const satisfies SlotStateMap<DividerSlot, DividerState>;

// =============================================================================
// COMPONENT PROPS — structural shell only
// =============================================================================

/**
 * DividerProps — props for the structureless divider primitive.
 *
 * Zero ARIA. Zero state logic. Zero styling.
 * The component layer (components/divider/) applies ARIA + data-state + recipe classes.
 * The `class` prop receives recipe-generated strings from the component layer.
 */
export interface DividerProps extends Omit<HTMLAttributes<HTMLHRElement>, "style">, BaseProps {}
