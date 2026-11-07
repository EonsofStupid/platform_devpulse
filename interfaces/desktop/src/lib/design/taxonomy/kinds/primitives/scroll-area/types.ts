/**
 * @file ScrollArea Taxonomy Types
 * @description Type vocabulary for the scroll-area primitive.
 * as const arrays → derived type unions. Consumed by contract.ts.
 *
 * kind: "scroll-area"
 * ariaStateProvider: "coldlight" — native HTML handles semantics.
 */

import type { SlotStateMap, StateToken } from "../../../types.js";

// ─── SLOT TYPES ─────────────────────────────────────────────────────────────

/** All slot names for the scroll-area primitive */
export const scrollAreaSlots = ["root", "viewport", "scrollbar", "thumb", "corner"] as const;

/** Union of scroll-area slot names */
export type ScrollAreaSlot = (typeof scrollAreaSlots)[number];

// ─── STATE TYPES ────────────────────────────────────────────────────────────

/** All state tokens applicable to the scroll-area primitive */
export const scrollAreaStateTokens = [
	"hover",
	"active",
	"visible",
	"hidden",
] as const satisfies readonly StateToken[];

/** Union of scroll-area state tokens */
export type ScrollAreaState = (typeof scrollAreaStateTokens)[number];

// ─── SLOT STATE MAP ─────────────────────────────────────────────────────────

/** Per-slot allowed states for scroll-area */
export const scrollAreaSlotStates = {
	root: [],
	viewport: [],
	scrollbar: ["visible", "hidden", "hover", "active"],
	thumb: ["hover", "active"],
	corner: [],
} as const satisfies SlotStateMap<ScrollAreaSlot, ScrollAreaState>;
