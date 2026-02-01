/**
 * @file Avatar Taxonomy Types
 * @description Type vocabulary for the avatar primitive.
 * as const arrays → derived type unions. Consumed by contract.ts.
 *
 * kind: "avatar"
 * ariaStateProvider: "coldlight" — image element with fallback, direct ARIA application.
 */

import type { StateToken, SlotStateMap } from "../../../types.js";

// ─── SLOT TYPES ─────────────────────────────────────────────────────────────

/** All slot names for the avatar primitive */
export const avatarSlots = ["root", "image", "fallback"] as const;

/** Union of avatar slot names */
export type AvatarSlot = (typeof avatarSlots)[number];

// ─── STATE TYPES ────────────────────────────────────────────────────────────

/** All state tokens applicable to the avatar primitive */
export const avatarStateTokens = [
	"hover",
	"active",
	"loading",
	"hidden",
	"visible",
] as const satisfies readonly StateToken[];

/** Union of avatar state tokens */
export type AvatarState = (typeof avatarStateTokens)[number];

// ─── SLOT STATE MAP ─────────────────────────────────────────────────────────

/** Per-slot allowed states for avatar */
export const avatarSlotStates = {
	root: ["hover", "active"],
	image: ["loading", "hidden", "visible"],
	fallback: ["visible", "hidden"],
} as const satisfies SlotStateMap<AvatarSlot, AvatarState>;
