/**
 * @file Tooltip Taxonomy Types
 * @description Type vocabulary for the tooltip primitive.
 * as const arrays → derived type unions. Consumed by contract.ts.
 *
 * kind: "tooltip"
 * ariaStateProvider: "meltui" — dsAdapter (createTooltip) provides ARIA + state.
 * Non-interactive informational popup on hover/focus.
 */

import type { StateToken, SlotStateMap } from "../../../types.js";

// ─── SLOT TYPES ─────────────────────────────────────────────────────────────

/** All slot names for the tooltip primitive */
export const tooltipSlots = [
	"root",
	"trigger",
	"content",
	"arrow",
] as const;

/** Union of tooltip slot names */
export type TooltipSlot = (typeof tooltipSlots)[number];

// ─── STATE TYPES ────────────────────────────────────────────────────────────

/** All state tokens applicable to the tooltip primitive */
export const tooltipStateTokens = [
	"focused",
	"focus-visible",
	"hover",
	"open",
	"hidden",
	"visible",
	"entering",
	"exiting",
] as const satisfies readonly StateToken[];

/** Union of tooltip state tokens */
export type TooltipState = (typeof tooltipStateTokens)[number];

// ─── SLOT STATE MAP ─────────────────────────────────────────────────────────

/** Per-slot allowed states for tooltip */
export const tooltipSlotStates = {
	root: ["open"],
	trigger: ["focused", "focus-visible", "hover"],
	content: ["visible", "entering", "exiting"],
	arrow: [],
} as const satisfies SlotStateMap<TooltipSlot, TooltipState>;
