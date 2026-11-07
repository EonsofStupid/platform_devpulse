/**
 * @file Alert Taxonomy Types
 * @description Type vocabulary for the alert primitive.
 * as const arrays → derived type unions. Consumed by contract.ts.
 *
 * kind: "alert"
 * ariaStateProvider: "coldlight" — native live region, direct ARIA application.
 */

import type { SlotStateMap, StateToken } from "../../../types.js";

// ─── SLOT TYPES ─────────────────────────────────────────────────────────────

/** All slot names for the alert primitive */
export const alertSlots = ["root", "title", "description"] as const;

/** Union of alert slot names */
export type AlertSlot = (typeof alertSlots)[number];

// ─── STATE TYPES ────────────────────────────────────────────────────────────

/** All state tokens applicable to the alert primitive */
export const alertStateTokens = [
	"hover",
	"active",
	"visible",
	"hidden",
] as const satisfies readonly StateToken[];

/** Union of alert state tokens */
export type AlertState = (typeof alertStateTokens)[number];

// ─── SLOT STATE MAP ─────────────────────────────────────────────────────────

/** Per-slot allowed states for alert */
export const alertSlotStates = {
	root: ["hover", "active", "visible", "hidden"],
	title: [],
	description: [],
} as const satisfies SlotStateMap<AlertSlot, AlertState>;
