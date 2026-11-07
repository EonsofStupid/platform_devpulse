/**
 * @file RadioGroup Taxonomy Types
 * @description Type vocabulary for the radio-group primitive.
 * as const arrays → derived type unions. Consumed by contract.ts.
 *
 * kind: "radio-group"
 * ariaStateProvider: "coldlight" — native buttons with role="radiogroup"/"radio" + aria-checked at component layer.
 * Exclusive single-selection from a set of options.
 */

import type { SlotStateMap, StateToken } from "../../../types.js";

// ─── SLOT TYPES ─────────────────────────────────────────────────────────────

/** All slot names for the radio-group primitive */
export const radioGroupSlots = ["root", "item", "indicator"] as const;

/** Union of radio-group slot names */
export type RadioGroupSlot = (typeof radioGroupSlots)[number];

// ─── STATE TYPES ────────────────────────────────────────────────────────────

/** All state tokens applicable to the radio-group primitive */
export const radioGroupStateTokens = [
	"checked",
	"hover",
	"active",
	"focused",
	"focus-visible",
	"disabled",
] as const satisfies readonly StateToken[];

/** Union of radio-group state tokens */
export type RadioGroupState = (typeof radioGroupStateTokens)[number];

// ─── SLOT STATE MAP ─────────────────────────────────────────────────────────

/** Per-slot allowed states for radio-group */
export const radioGroupSlotStates = {
	root: ["disabled"],
	item: ["checked", "hover", "active", "focused", "focus-visible", "disabled"],
	indicator: ["checked"],
} as const satisfies SlotStateMap<RadioGroupSlot, RadioGroupState>;
