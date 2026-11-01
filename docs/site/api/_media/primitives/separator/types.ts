/**
 * @file primitives/separator/types.ts
 * @kind separator
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Separator primitive type declarations — structural props, slot/state vocabularies.
 * Lives WITH the implementation per ColdLight architecture.
 *
 * ariaStateProvider: "coldlight" — ColdLight owns ARIA. This primitive is zero-ARIA.
 * ARIA is applied by the component layer (components/separator/).
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/
 */

import type { HTMLAttributes } from "svelte/elements";
import type { StateToken, SlotStateMap } from "../_schema/types.js";
import type { BaseProps } from "../types.js";

// =============================================================================
// SLOT VOCABULARY
// =============================================================================

/** Slot names for the separator primitive */
export const separatorSlots = ["root"] as const;
export type SeparatorSlot = (typeof separatorSlots)[number];

// =============================================================================
// STATE VOCABULARY
// =============================================================================

/** State tokens applicable to the separator primitive */
export const separatorStateTokens = [] as const satisfies readonly StateToken[];
export type SeparatorState = (typeof separatorStateTokens)[number];

// =============================================================================
// SLOT STATE MAP
// =============================================================================

/** Maps each separator slot to its allowed state tokens */
export const separatorSlotStates = {
	root: [],
} as const satisfies SlotStateMap<SeparatorSlot, SeparatorState>;

// =============================================================================
// COMPONENT PROPS — structural shell only
// =============================================================================

/**
 * SeparatorProps — props for the structureless separator primitive.
 *
 * Zero ARIA. Zero state logic. Zero styling.
 * The component layer (components/separator/) applies ARIA + data-state + recipe classes.
 * The `class` prop receives recipe-generated strings from the component layer.
 */
export interface SeparatorProps extends Omit<HTMLAttributes<HTMLHRElement>, "style">, BaseProps {}
