/**
 * @file Toolbar Taxonomy Types
 * @description Type vocabulary for the toolbar primitive.
 * as const arrays → derived type unions. Consumed by contract.ts.
 *
 * kind: "toolbar"
 * ariaStateProvider: "coldlight" — native HTML handles semantics.
 */

import type { SlotStateMap, StateToken } from "../../../types.js";

// ─── SLOT TYPES ─────────────────────────────────────────────────────────────

/** All slot names for the toolbar primitive */
export const toolbarSlots = ["root", "group", "item", "separator", "link"] as const;

/** Union of toolbar slot names */
export type ToolbarSlot = (typeof toolbarSlots)[number];

// ─── STATE TYPES ────────────────────────────────────────────────────────────

/** All state tokens applicable to the toolbar primitive */
export const toolbarStateTokens = [
	"focused",
	"focus-visible",
	"hover",
	"active",
	"disabled",
] as const satisfies readonly StateToken[];

/** Union of toolbar state tokens */
export type ToolbarState = (typeof toolbarStateTokens)[number];

// ─── SLOT STATE MAP ─────────────────────────────────────────────────────────

/** Per-slot allowed states for toolbar */
export const toolbarSlotStates = {
	root: ["disabled"],
	group: [],
	item: ["focused", "focus-visible", "hover", "active", "disabled"],
	separator: [],
	link: ["focused", "focus-visible", "hover", "active"],
} as const satisfies SlotStateMap<ToolbarSlot, ToolbarState>;
