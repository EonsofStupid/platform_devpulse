/**
 * @file Pagination Taxonomy Types
 * @description Type vocabulary for the pagination primitive.
 * as const arrays → derived type unions. Consumed by contract.ts.
 *
 * kind: "pagination"
 * ariaStateProvider: "meltui" — createPagination provides ARIA roles and keyboard nav.
 */

import type { SlotStateMap, StateToken } from "../../../types.js";

// ─── SLOT TYPES ─────────────────────────────────────────────────────────────

/** All slot names for the pagination primitive */
export const paginationSlots = ["root", "content", "item", "previous", "next", "ellipsis"] as const;

/** Union of pagination slot names */
export type PaginationSlot = (typeof paginationSlots)[number];

// ─── STATE TYPES ────────────────────────────────────────────────────────────

/** All state tokens applicable to the pagination primitive */
export const paginationStateTokens = [
	"hover",
	"active",
	"focused",
	"focus-visible",
	"disabled",
	"selected",
] as const satisfies readonly StateToken[];

/** Union of pagination state tokens */
export type PaginationState = (typeof paginationStateTokens)[number];

// ─── SLOT STATE MAP ─────────────────────────────────────────────────────────

/** Per-slot allowed states for pagination */
export const paginationSlotStates = {
	root: [],
	content: [],
	item: ["hover", "active", "focused", "focus-visible", "disabled", "selected"],
	previous: ["hover", "active", "focused", "focus-visible", "disabled"],
	next: ["hover", "active", "focused", "focus-visible", "disabled"],
	ellipsis: [],
} as const satisfies SlotStateMap<PaginationSlot, PaginationState>;
