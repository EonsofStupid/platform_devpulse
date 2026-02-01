/**
 * @file Popover Taxonomy Types
 * @description Type vocabulary for the popover primitive.
 * as const arrays → derived type unions. Consumed by contract.ts.
 *
 * kind: "popover"
 * ariaStateProvider: "meltui" — dsAdapter (createPopover) provides ARIA + state.
 * Floating content panel anchored to a trigger element.
 */

import type { StateToken, SlotStateMap } from "../../../types.js";

// ─── SLOT TYPES ─────────────────────────────────────────────────────────────

/** All slot names for the popover primitive */
export const popoverSlots = [
	"root",
	"trigger",
	"content",
	"arrow",
	"close",
] as const;

/** Union of popover slot names */
export type PopoverSlot = (typeof popoverSlots)[number];

// ─── STATE TYPES ────────────────────────────────────────────────────────────

/** All state tokens applicable to the popover primitive */
export const popoverStateTokens = [
	"focused",
	"focus-visible",
	"focus-within",
	"hover",
	"active",
	"open",
	"closed",
	"hidden",
	"visible",
	"entering",
	"exiting",
] as const satisfies readonly StateToken[];

/** Union of popover state tokens */
export type PopoverState = (typeof popoverStateTokens)[number];

// ─── SLOT STATE MAP ─────────────────────────────────────────────────────────

/** Per-slot allowed states for popover */
export const popoverSlotStates = {
	root: ["open", "closed"],
	trigger: ["focused", "focus-visible", "hover", "active", "open", "closed"],
	content: ["open", "closed", "focus-within", "entering", "exiting"],
	arrow: [],
	close: ["focused", "focus-visible", "hover", "active"],
} as const satisfies SlotStateMap<PopoverSlot, PopoverState>;
