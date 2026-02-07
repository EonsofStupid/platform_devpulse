/**
 * @file ContextMenu Taxonomy Types
 * @description Type vocabulary for the context-menu primitive.
 * as const arrays → derived type unions. Consumed by contract.ts.
 *
 * kind: "context-menu"
 * ariaStateProvider: "meltui" — dsAdapter provides ARIA + state for right-click menu.
 * Nearly identical to dropdown-menu but triggered by right-click (contextmenu event).
 */

import type { SlotStateMap, StateToken } from "../../../types.js";

// ─── SLOT TYPES ─────────────────────────────────────────────────────────────

/** All slot names for the context-menu primitive */
export const contextMenuSlots = [
	"root",
	"trigger",
	"content",
	"group",
	"item",
	"checkbox-item",
	"radio-group",
	"radio-item",
	"label",
	"separator",
	"sub",
	"sub-trigger",
	"sub-content",
] as const;

/** Union of context-menu slot names */
export type ContextMenuSlot = (typeof contextMenuSlots)[number];

// ─── STATE TYPES ────────────────────────────────────────────────────────────

/** All state tokens applicable to the context-menu primitive */
export const contextMenuStateTokens = [
	"open",
	"closed",
	"hover",
	"active",
	"focused",
	"focus-visible",
	"disabled",
	"checked",
	"indeterminate",
] as const satisfies readonly StateToken[];

/** Union of context-menu state tokens */
export type ContextMenuState = (typeof contextMenuStateTokens)[number];

// ─── SLOT STATE MAP ─────────────────────────────────────────────────────────

/** Per-slot allowed states for context-menu */
export const contextMenuSlotStates = {
	root: [],
	trigger: ["hover", "active"],
	content: ["open", "closed"],
	group: [],
	item: ["hover", "active", "focused", "focus-visible", "disabled"],
	"checkbox-item": [
		"hover",
		"active",
		"focused",
		"focus-visible",
		"disabled",
		"checked",
		"indeterminate",
	],
	"radio-group": [],
	"radio-item": ["hover", "active", "focused", "focus-visible", "disabled", "checked"],
	label: [],
	separator: [],
	sub: [],
	"sub-trigger": ["hover", "active", "focused", "focus-visible", "disabled", "open", "closed"],
	"sub-content": ["open", "closed"],
} as const satisfies SlotStateMap<ContextMenuSlot, ContextMenuState>;
