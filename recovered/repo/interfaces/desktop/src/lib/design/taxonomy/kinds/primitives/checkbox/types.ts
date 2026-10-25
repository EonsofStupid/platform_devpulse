/**
 * @file Checkbox Taxonomy Types
 * @description Type vocabulary for the checkbox primitive.
 * as const arrays → derived type unions. Consumed by contract.ts.
 *
 * kind: "checkbox"
 * ariaStateProvider: "coldlight" — native <button> with role="checkbox" + aria-checked at component layer.
 * Tri-state: checked / unchecked / indeterminate.
 */

import type { SlotStateMap, StateToken } from "../../../types.js";

// ─── SLOT TYPES ─────────────────────────────────────────────────────────────

/** All slot names for the checkbox primitive */
export const checkboxSlots = ["root", "indicator"] as const;

/** Union of checkbox slot names */
export type CheckboxSlot = (typeof checkboxSlots)[number];

// ─── STATE TYPES ────────────────────────────────────────────────────────────

/** All state tokens applicable to the checkbox primitive */
export const checkboxStateTokens = [
	"checked",
	"indeterminate",
	"hover",
	"active",
	"focused",
	"focus-visible",
	"disabled",
] as const satisfies readonly StateToken[];

/** Union of checkbox state tokens */
export type CheckboxState = (typeof checkboxStateTokens)[number];

// ─── SLOT STATE MAP ─────────────────────────────────────────────────────────

/** Per-slot allowed states for checkbox */
export const checkboxSlotStates = {
	root: ["checked", "indeterminate", "hover", "active", "focused", "focus-visible", "disabled"],
	indicator: ["checked", "indeterminate"],
} as const satisfies SlotStateMap<CheckboxSlot, CheckboxState>;
