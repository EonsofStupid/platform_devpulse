/**
 * @file Card Taxonomy Types
 * @description Type vocabulary for the card primitive.
 * as const arrays → derived type unions. Consumed by contract.ts.
 *
 * kind: "card"
 * ariaStateProvider: "coldlight" — semantic grouping container, direct ARIA application.
 */

import type { SlotStateMap, StateToken } from "../../../types.js";

// ─── SLOT TYPES ─────────────────────────────────────────────────────────────

/** All slot names for the card primitive */
export const cardSlots = ["root", "header", "title", "description", "content", "footer"] as const;

/** Union of card slot names */
export type CardSlot = (typeof cardSlots)[number];

// ─── STATE TYPES ────────────────────────────────────────────────────────────

/** All state tokens applicable to the card primitive */
export const cardStateTokens = [
	"hover",
	"active",
	"focused",
	"focus-visible",
	"disabled",
	"selected",
] as const satisfies readonly StateToken[];

/** Union of card state tokens */
export type CardState = (typeof cardStateTokens)[number];

// ─── SLOT STATE MAP ─────────────────────────────────────────────────────────

/** Per-slot allowed states for card */
export const cardSlotStates = {
	root: ["hover", "active", "focused", "focus-visible", "disabled", "selected"],
	header: [],
	title: [],
	description: [],
	content: [],
	footer: [],
} as const satisfies SlotStateMap<CardSlot, CardState>;
