/**
 * @file Progress Taxonomy Types
 * @description Type vocabulary for the progress primitive.
 * as const arrays → derived type unions. Consumed by contract.ts.
 *
 * kind: "progress"
 * ariaStateProvider: "coldlight" — native range widget, direct ARIA application.
 */

import type { SlotStateMap, StateToken } from "../../../types.js";

// ─── SLOT TYPES ─────────────────────────────────────────────────────────────

/** All slot names for the progress primitive */
export const progressSlots = ["root", "indicator"] as const;

/** Union of progress slot names */
export type ProgressSlot = (typeof progressSlots)[number];

// ─── STATE TYPES ────────────────────────────────────────────────────────────

/** All state tokens applicable to the progress primitive */
export const progressStateTokens = [
	"hover",
	"active",
	"disabled",
	"indeterminate",
	"loading",
] as const satisfies readonly StateToken[];

/** Union of progress state tokens */
export type ProgressState = (typeof progressStateTokens)[number];

// ─── SLOT STATE MAP ─────────────────────────────────────────────────────────

/** Per-slot allowed states for progress */
export const progressSlotStates = {
	root: ["hover", "active", "disabled", "indeterminate", "loading"],
	indicator: ["indeterminate", "loading"],
} as const satisfies SlotStateMap<ProgressSlot, ProgressState>;
