/**
 * @file HoverCard Taxonomy Types
 * @description Type vocabulary for the hover-card primitive.
 * as const arrays → derived type unions. Consumed by contract.ts.
 *
 * kind: "hover-card"
 * ariaStateProvider: "meltui" — createLinkPreview provides hover timing, positioning, and dismiss behavior.
 */

import type { SlotStateMap, StateToken } from "../../../types.js";

// ─── SLOT TYPES ─────────────────────────────────────────────────────────────

/** All slot names for the hover-card primitive */
export const hoverCardSlots = ["root", "trigger", "content", "arrow"] as const;

/** Union of hover-card slot names */
export type HoverCardSlot = (typeof hoverCardSlots)[number];

// ─── STATE TYPES ────────────────────────────────────────────────────────────

/** All state tokens applicable to the hover-card primitive */
export const hoverCardStateTokens = [
	"open",
	"closed",
	"hover",
] as const satisfies readonly StateToken[];

/** Union of hover-card state tokens */
export type HoverCardState = (typeof hoverCardStateTokens)[number];

// ─── SLOT STATE MAP ─────────────────────────────────────────────────────────

/** Per-slot allowed states for hover-card */
export const hoverCardSlotStates = {
	root: ["open", "closed"],
	trigger: ["hover"],
	content: ["open", "closed"],
	arrow: [],
} as const satisfies SlotStateMap<HoverCardSlot, HoverCardState>;
