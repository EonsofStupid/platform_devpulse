/**
 * @file VisuallyHidden Taxonomy Types
 * @description Type vocabulary for the visually-hidden utility primitive.
 * as const arrays → derived type unions. Consumed by contract.ts.
 *
 * kind: "visually-hidden"
 * ariaStateProvider: "coldlight" — CSS-only screen-reader utility, zero JS behavior.
 * Renders content visible only to assistive technology (screen readers).
 */

import type { SlotStateMap, StateToken } from "../../../types.js";

// ─── SLOT TYPES ─────────────────────────────────────────────────────────────

/** All slot names for the visually-hidden primitive */
export const visuallyHiddenSlots = ["root"] as const;

/** Union of visually-hidden slot names */
export type VisuallyHiddenSlot = (typeof visuallyHiddenSlots)[number];

// ─── STATE TYPES ────────────────────────────────────────────────────────────

/** All state tokens applicable to the visually-hidden primitive */
export const visuallyHiddenStateTokens = [] as const satisfies readonly StateToken[];

/** Union of visually-hidden state tokens */
export type VisuallyHiddenState = (typeof visuallyHiddenStateTokens)[number];

// ─── SLOT STATE MAP ─────────────────────────────────────────────────────────

/** Per-slot allowed states for visually-hidden */
export const visuallyHiddenSlotStates = {
	root: [],
} as const satisfies SlotStateMap<VisuallyHiddenSlot, VisuallyHiddenState>;
