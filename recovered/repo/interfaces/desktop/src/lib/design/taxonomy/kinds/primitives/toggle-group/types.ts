/**
 * @file ToggleGroup Taxonomy Types
 * @description Type vocabulary for the toggle-group primitive.
 * as const arrays → derived type unions. Consumed by contract.ts.
 *
 * kind: "toggle-group"
 * ariaStateProvider: "meltui" — createToggleGroup provides roving tabindex + aria-pressed management.
 */

import type { SlotStateMap, StateToken } from "../../../types.js";

// ─── SLOT TYPES ─────────────────────────────────────────────────────────────

/** All slot names for the toggle-group primitive */
export const toggleGroupSlots = ["root", "item"] as const;

/** Union of toggle-group slot names */
export type ToggleGroupSlot = (typeof toggleGroupSlots)[number];

// ─── STATE TYPES ────────────────────────────────────────────────────────────

/** All state tokens applicable to the toggle-group primitive */
export const toggleGroupStateTokens = [
	"pressed",
	"hover",
	"active",
	"focused",
	"focus-visible",
	"disabled",
] as const satisfies readonly StateToken[];

/** Union of toggle-group state tokens */
export type ToggleGroupState = (typeof toggleGroupStateTokens)[number];

// ─── SLOT STATE MAP ─────────────────────────────────────────────────────────

/** Per-slot allowed states for toggle-group */
export const toggleGroupSlotStates = {
	root: ["disabled"],
	item: ["pressed", "hover", "active", "focused", "focus-visible", "disabled"],
} as const satisfies SlotStateMap<ToggleGroupSlot, ToggleGroupState>;
