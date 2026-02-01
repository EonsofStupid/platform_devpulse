/**
 * @file Separator Taxonomy Types
 * @description Type vocabulary for the separator primitive.
 * as const arrays → derived type unions. Consumed by contract.ts.
 *
 * kind: "separator"
 * ariaStateProvider: "coldlight" — native HTML handles semantics.
 */

import type { StateToken, SlotStateMap } from "../../../types.js";

// ─── SLOT TYPES ─────────────────────────────────────────────────────────────

/** All slot names for the separator primitive */
export const separatorSlots = ["root"] as const;

/** Union of separator slot names */
export type SeparatorSlot = (typeof separatorSlots)[number];

// ─── STATE TYPES ────────────────────────────────────────────────────────────

/** All state tokens applicable to the separator primitive */
export const separatorStateTokens = [
	"focused",
	"focus-visible",
	"hover",
	"active",
	"disabled",
] as const satisfies readonly StateToken[];

/** Union of separator state tokens */
export type SeparatorState = (typeof separatorStateTokens)[number];

// ─── SLOT STATE MAP ─────────────────────────────────────────────────────────

/** Per-slot allowed states for separator */
export const separatorSlotStates = {
	root: ["focused", "focus-visible", "hover", "active", "disabled"],
} as const satisfies SlotStateMap<SeparatorSlot, SeparatorState>;
