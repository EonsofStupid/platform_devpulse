/**
 * @file Collapsible Taxonomy Types
 * @description Type vocabulary for the collapsible primitive.
 * as const arrays → derived type unions. Consumed by contract.ts.
 *
 * kind: "collapsible"
 * ariaStateProvider: "coldlight" — native HTML handles semantics.
 */

import type { StateToken, SlotStateMap } from "../../../types.js";

// ─── SLOT TYPES ─────────────────────────────────────────────────────────────

/** All slot names for the collapsible primitive */
export const collapsibleSlots = ["root", "trigger", "content"] as const;

/** Union of collapsible slot names */
export type CollapsibleSlot = (typeof collapsibleSlots)[number];

// ─── STATE TYPES ────────────────────────────────────────────────────────────

/** All state tokens applicable to the collapsible primitive */
export const collapsibleStateTokens = [
	"focused",
	"focus-visible",
	"hover",
	"active",
	"disabled",
	"open",
	"closed",
] as const satisfies readonly StateToken[];

/** Union of collapsible state tokens */
export type CollapsibleState = (typeof collapsibleStateTokens)[number];

// ─── SLOT STATE MAP ─────────────────────────────────────────────────────────

/** Per-slot allowed states for collapsible */
export const collapsibleSlotStates = {
	root: ["open", "closed", "disabled"],
	trigger: ["focused", "focus-visible", "hover", "active", "disabled", "open", "closed"],
	content: ["open", "closed"],
} as const satisfies SlotStateMap<CollapsibleSlot, CollapsibleState>;
