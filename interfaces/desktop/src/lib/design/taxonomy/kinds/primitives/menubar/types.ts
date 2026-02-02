/**
 * @file Menubar Taxonomy Types
 * @description Type vocabulary for the menubar primitive.
 * as const arrays → derived type unions. Consumed by contract.ts.
 *
 * kind: "menubar"
 * ariaStateProvider: "meltui" — createMenubar provides roving tabindex + menu management.
 */

import type { StateToken, SlotStateMap } from "../../../types.js";

// ─── SLOT TYPES ─────────────────────────────────────────────────────────────

/** All slot names for the menubar primitive */
export const menubarSlots = [
	"root",
	"menu",
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

/** Union of menubar slot names */
export type MenubarSlot = (typeof menubarSlots)[number];

// ─── STATE TYPES ────────────────────────────────────────────────────────────

/** All state tokens applicable to the menubar primitive */
export const menubarStateTokens = [
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

/** Union of menubar state tokens */
export type MenubarState = (typeof menubarStateTokens)[number];

// ─── SLOT STATE MAP ─────────────────────────────────────────────────────────

/** Per-slot allowed states for menubar */
export const menubarSlotStates = {
	root: ["hover", "active"],
	menu: [],
	trigger: ["hover", "active", "focused", "focus-visible", "disabled", "open", "closed"],
	content: ["open", "closed"],
	group: [],
	item: ["hover", "active", "focused", "focus-visible", "disabled"],
	"checkbox-item": ["hover", "active", "focused", "focus-visible", "disabled", "checked", "indeterminate"],
	"radio-group": [],
	"radio-item": ["hover", "active", "focused", "focus-visible", "disabled", "checked"],
	label: [],
	separator: [],
	sub: [],
	"sub-trigger": ["hover", "active", "focused", "focus-visible", "disabled", "open", "closed"],
	"sub-content": ["open", "closed"],
} as const satisfies SlotStateMap<MenubarSlot, MenubarState>;
