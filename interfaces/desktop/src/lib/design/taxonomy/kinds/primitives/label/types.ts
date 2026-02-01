/**
 * @file Label Taxonomy Types
 * @description Type vocabulary for the label primitive.
 * as const arrays → derived type unions. Consumed by contract.ts.
 *
 * kind: "label"
 * ariaStateProvider: "coldlight" — native <label> handles semantics.
 */

import type { StateToken, SlotStateMap } from "../../../types.js";

// ─── SLOT TYPES ─────────────────────────────────────────────────────────────

/** All slot names for the label primitive */
export const labelSlots = ["root"] as const;

/** Union of label slot names */
export type LabelSlot = (typeof labelSlots)[number];

// ─── STATE TYPES ────────────────────────────────────────────────────────────

/** All state tokens applicable to the label primitive */
export const labelStateTokens = [
	"focused",
	"focus-visible",
	"hover",
	"active",
	"disabled",
] as const satisfies readonly StateToken[];

/** Union of label state tokens */
export type LabelState = (typeof labelStateTokens)[number];

// ─── SLOT STATE MAP ─────────────────────────────────────────────────────────

/** Per-slot allowed states for label */
export const labelSlotStates = {
	root: ["focused", "focus-visible", "hover", "active", "disabled"],
} as const satisfies SlotStateMap<LabelSlot, LabelState>;
