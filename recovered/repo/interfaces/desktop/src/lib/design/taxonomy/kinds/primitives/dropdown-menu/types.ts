/**
 * @file DropdownMenu Taxonomy Types
 * @description Type vocabulary for the dropdown-menu primitive.
 * as const arrays → derived type unions. Consumed by contract.ts.
 *
 * kind: "dropdown-menu"
 * ariaStateProvider: "meltui" — createDropdownMenu provides ARIA roles, keyboard nav, and dismiss behavior.
 */

import type { SlotStateMap, StateToken } from "../../../types.js";

// ─── SLOT TYPES ─────────────────────────────────────────────────────────────

/** All slot names for the dropdown-menu primitive */
export const dropdownMenuSlots = [
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

/** Union of dropdown-menu slot names */
export type DropdownMenuSlot = (typeof dropdownMenuSlots)[number];

// ─── STATE TYPES ────────────────────────────────────────────────────────────

/** All state tokens applicable to the dropdown-menu primitive */
export const dropdownMenuStateTokens = [
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

/** Union of dropdown-menu state tokens */
export type DropdownMenuState = (typeof dropdownMenuStateTokens)[number];

// ─── SLOT STATE MAP ─────────────────────────────────────────────────────────

/** Per-slot allowed states for dropdown-menu */
export const dropdownMenuSlotStates = {
	root: [],
	trigger: ["hover", "active", "focused", "focus-visible", "disabled"],
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
} as const satisfies SlotStateMap<DropdownMenuSlot, DropdownMenuState>;
