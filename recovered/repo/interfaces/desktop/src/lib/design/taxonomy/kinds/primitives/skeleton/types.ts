/**
 * @file Skeleton Taxonomy Types
 * @description Type vocabulary for the skeleton primitive.
 * as const arrays → derived type unions. Consumed by contract.ts.
 *
 * kind: "skeleton"
 * ariaStateProvider: "coldlight" — presentational placeholder, no complex state machine.
 */

import type { SlotStateMap, StateToken } from "../../../types.js";

// ─── SLOT TYPES ─────────────────────────────────────────────────────────────

/** All slot names for the skeleton primitive */
export const skeletonSlots = ["root"] as const;

/** Union of skeleton slot names */
export type SkeletonSlot = (typeof skeletonSlots)[number];

// ─── STATE TYPES ────────────────────────────────────────────────────────────

/** All state tokens applicable to the skeleton primitive */
export const skeletonStateTokens = [
	"loading",
	"busy",
	"visible",
	"hidden",
] as const satisfies readonly StateToken[];

/** Union of skeleton state tokens */
export type SkeletonState = (typeof skeletonStateTokens)[number];

// ─── SLOT STATE MAP ─────────────────────────────────────────────────────────

/** Per-slot allowed states for skeleton */
export const skeletonSlotStates = {
	root: ["loading", "busy", "visible", "hidden"],
} as const satisfies SlotStateMap<SkeletonSlot, SkeletonState>;
