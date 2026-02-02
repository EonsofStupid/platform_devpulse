/**
 * @file Breadcrumb Taxonomy Types
 * @description Type vocabulary for the breadcrumb primitive.
 * as const arrays → derived type unions. Consumed by contract.ts.
 *
 * kind: "breadcrumb"
 * ariaStateProvider: "coldlight" — semantic HTML landmarks + aria-current for current page indication.
 */

import type { StateToken, SlotStateMap } from "../../../types.js";

// ─── SLOT TYPES ─────────────────────────────────────────────────────────────

/** All slot names for the breadcrumb primitive */
export const breadcrumbSlots = ["root", "list", "item", "link", "separator", "page"] as const;

/** Union of breadcrumb slot names */
export type BreadcrumbSlot = (typeof breadcrumbSlots)[number];

// ─── STATE TYPES ────────────────────────────────────────────────────────────

/** All state tokens applicable to the breadcrumb primitive */
export const breadcrumbStateTokens = [
	"hover",
	"active",
	"focused",
	"focus-visible",
	"disabled",
] as const satisfies readonly StateToken[];

/** Union of breadcrumb state tokens */
export type BreadcrumbState = (typeof breadcrumbStateTokens)[number];

// ─── SLOT STATE MAP ─────────────────────────────────────────────────────────

/** Per-slot allowed states for breadcrumb */
export const breadcrumbSlotStates = {
	root: [],
	list: [],
	item: [],
	link: ["hover", "active", "focused", "focus-visible", "disabled"],
	separator: [],
	page: [],
} as const satisfies SlotStateMap<BreadcrumbSlot, BreadcrumbState>;
