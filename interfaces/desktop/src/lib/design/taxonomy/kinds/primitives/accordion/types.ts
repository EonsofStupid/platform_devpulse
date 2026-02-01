/**
 * @file Accordion Taxonomy Types
 * @description Type vocabulary for the accordion primitive.
 * as const arrays → derived type unions. Consumed by contract.ts.
 *
 * kind: "accordion"
 * ariaStateProvider: "coldlight" — native HTML handles semantics.
 */

import type { StateToken, SlotStateMap } from "../../../types.js";

// ─── SLOT TYPES ─────────────────────────────────────────────────────────────

/** All slot names for the accordion primitive */
export const accordionSlots = ["root", "item", "header", "trigger", "content"] as const;

/** Union of accordion slot names */
export type AccordionSlot = (typeof accordionSlots)[number];

// ─── STATE TYPES ────────────────────────────────────────────────────────────

/** All state tokens applicable to the accordion primitive */
export const accordionStateTokens = [
	"focused",
	"focus-visible",
	"hover",
	"active",
	"disabled",
	"open",
	"closed",
] as const satisfies readonly StateToken[];

/** Union of accordion state tokens */
export type AccordionState = (typeof accordionStateTokens)[number];

// ─── SLOT STATE MAP ─────────────────────────────────────────────────────────

/** Per-slot allowed states for accordion */
export const accordionSlotStates = {
	root: ["disabled"],
	item: ["open", "closed", "disabled"],
	header: [],
	trigger: ["focused", "focus-visible", "hover", "active", "disabled"],
	content: ["open", "closed"],
} as const satisfies SlotStateMap<AccordionSlot, AccordionState>;
