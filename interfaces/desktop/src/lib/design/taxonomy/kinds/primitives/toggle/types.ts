/**
 * @file Toggle Taxonomy Types
 * @description Type vocabulary for the toggle primitive.
 * as const arrays → derived type unions. Consumed by contract.ts.
 *
 * kind: "toggle"
 * ariaStateProvider: "coldlight" — native <button> + aria-pressed at component layer.
 */

import type { StateToken, SlotStateMap } from "../../../types.js";

// ─── SLOT TYPES ─────────────────────────────────────────────────────────────

/** All slot names for the toggle primitive */
export const toggleSlots = ["root"] as const;

/** Union of toggle slot names */
export type ToggleSlot = (typeof toggleSlots)[number];

// ─── STATE TYPES ────────────────────────────────────────────────────────────

/** All state tokens applicable to the toggle primitive */
export const toggleStateTokens = [
	"pressed",
	"focused",
	"focus-visible",
	"hover",
	"active",
	"disabled",
] as const satisfies readonly StateToken[];

/** Union of toggle state tokens */
export type ToggleState = (typeof toggleStateTokens)[number];

// ─── SLOT STATE MAP ─────────────────────────────────────────────────────────

/** Per-slot allowed states for toggle */
export const toggleSlotStates = {
	root: ["pressed", "focused", "focus-visible", "hover", "active", "disabled"],
} as const satisfies SlotStateMap<ToggleSlot, ToggleState>;
