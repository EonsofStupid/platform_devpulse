/**
 * @file primitives/skeleton/types.ts
 * @kind skeleton
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Skeleton primitive type declarations — structural props, slot/state vocabularies.
 * Lives WITH the implementation per ColdLight architecture.
 *
 * ariaStateProvider: "coldlight" — ColdLight owns ARIA. This primitive is zero-ARIA.
 * ARIA is applied by the component layer (components/skeleton/).
 */

import type { HTMLAttributes } from "svelte/elements";
import type { StateToken, SlotStateMap } from "../_schema/types.js";
import type { BaseProps } from "../types.js";

// =============================================================================
// SLOT VOCABULARY
// =============================================================================

/** Slot names for the skeleton primitive */
export const skeletonSlots = ["root"] as const;
export type SkeletonSlot = (typeof skeletonSlots)[number];

// =============================================================================
// STATE VOCABULARY
// =============================================================================

/** State tokens applicable to the skeleton primitive */
export const skeletonStateTokens = ["loading"] as const satisfies readonly StateToken[];
export type SkeletonState = (typeof skeletonStateTokens)[number];

// =============================================================================
// SLOT STATE MAP
// =============================================================================

/** Maps each skeleton slot to its allowed state tokens */
export const skeletonSlotStates = {
	root: ["loading"],
} as const satisfies SlotStateMap<SkeletonSlot, SkeletonState>;

// =============================================================================
// COMPONENT PROPS — structural shell only
// =============================================================================

/**
 * SkeletonProps — props for the structureless skeleton primitive.
 *
 * Zero ARIA. Zero state logic. Zero styling. No children.
 * The component layer (components/skeleton/) applies ARIA + data-state + recipe classes.
 * The `class` prop receives recipe-generated strings from the component layer.
 */
export interface SkeletonProps extends Omit<HTMLAttributes<HTMLDivElement>, "style">, BaseProps {}
