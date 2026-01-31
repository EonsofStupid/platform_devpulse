/**
 * @file Tabs Taxonomy Types
 * @description Type vocabulary for the tabs primitive.
 * as const arrays → derived type unions. Consumed by contract.ts.
 *
 * kind: "tabs"
 * ariaStateProvider: "meltui" — dsAdapter provides ARIA + state machinery.
 */

import type { StateToken, SlotStateMap } from "../../../types.js";

// ─── SLOT TYPES ─────────────────────────────────────────────────────────────

/** All slot names for the tabs primitive */
export const tabsSlots = ["root", "list", "trigger", "content"] as const;

/** Union of tabs slot names */
export type TabsSlot = (typeof tabsSlots)[number];

// ─── STATE TYPES ────────────────────────────────────────────────────────────

/** All state tokens applicable to the tabs primitive */
export const tabsStateTokens = [
	"focused",
	"focus-visible",
	"focus-within",
	"hover",
	"active",
	"disabled",
	"hidden",
	"visible",
	"selected",
] as const satisfies readonly StateToken[];

/** Union of tabs state tokens */
export type TabsState = (typeof tabsStateTokens)[number];

// ─── SLOT STATE MAP ─────────────────────────────────────────────────────────

/** Per-slot allowed states for tabs */
export const tabsSlotStates = {
	root: [],
	list: ["focus-within"],
	trigger: ["selected", "focused", "focus-visible", "hover", "active", "disabled"],
	content: ["hidden", "visible"],
} as const satisfies SlotStateMap<TabsSlot, TabsState>;
