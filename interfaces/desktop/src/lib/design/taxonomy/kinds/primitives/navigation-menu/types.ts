/**
 * @file NavigationMenu Taxonomy Types
 * @description Type vocabulary for the navigation-menu primitive.
 * as const arrays → derived type unions. Consumed by contract.ts.
 *
 * kind: "navigation-menu"
 * ariaStateProvider: "coldlight" — semantic HTML nav landmark with roving tabindex.
 */

import type { SlotStateMap, StateToken } from "../../../types.js";

// ─── SLOT TYPES ─────────────────────────────────────────────────────────────

/** All slot names for the navigation-menu primitive */
export const navigationMenuSlots = [
	"root",
	"list",
	"item",
	"trigger",
	"content",
	"link",
	"viewport",
] as const;

/** Union of navigation-menu slot names */
export type NavigationMenuSlot = (typeof navigationMenuSlots)[number];

// ─── STATE TYPES ────────────────────────────────────────────────────────────

/** All state tokens applicable to the navigation-menu primitive */
export const navigationMenuStateTokens = [
	"open",
	"closed",
	"hover",
	"active",
	"focused",
	"focus-visible",
	"disabled",
] as const satisfies readonly StateToken[];

/** Union of navigation-menu state tokens */
export type NavigationMenuState = (typeof navigationMenuStateTokens)[number];

// ─── SLOT STATE MAP ─────────────────────────────────────────────────────────

/** Per-slot allowed states for navigation-menu */
export const navigationMenuSlotStates = {
	root: ["hover", "active"],
	list: [],
	item: ["hover", "active"],
	trigger: ["hover", "active", "focused", "focus-visible", "disabled", "open", "closed"],
	content: ["open", "closed"],
	link: ["hover", "active", "focused", "focus-visible", "disabled"],
	viewport: [],
} as const satisfies SlotStateMap<NavigationMenuSlot, NavigationMenuState>;
