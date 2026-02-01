/**
 * @file Badge Taxonomy Types
 * @description Type vocabulary for the badge primitive.
 * as const arrays → derived type unions. Consumed by contract.ts.
 *
 * kind: "badge"
 * ariaStateProvider: "coldlight" — decorative element, minimal ARIA.
 */

import type { StateToken, SlotStateMap } from "../../../types.js";

// ─── SLOT TYPES ─────────────────────────────────────────────────────────────

/** All slot names for the badge primitive */
export const badgeSlots = ["root"] as const;

/** Union of badge slot names */
export type BadgeSlot = (typeof badgeSlots)[number];

// ─── STATE TYPES ────────────────────────────────────────────────────────────

/** All state tokens applicable to the badge primitive */
export const badgeStateTokens = [
	"hover",
	"active",
] as const satisfies readonly StateToken[];

/** Union of badge state tokens */
export type BadgeState = (typeof badgeStateTokens)[number];

// ─── SLOT STATE MAP ─────────────────────────────────────────────────────────

/** Per-slot allowed states for badge */
export const badgeSlotStates = {
	root: ["hover", "active"],
} as const satisfies SlotStateMap<BadgeSlot, BadgeState>;
