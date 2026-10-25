/**
 * @file primitives/pagination/types.ts
 * @kind pagination
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Pagination primitive — navigation landmark with page controls.
 * ariaStateProvider: "meltui" — MeltUI adapter handles ARIA via new Pagination().
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes, HTMLButtonAttributes } from "svelte/elements";
import type { StateToken, SlotStateMap } from "../_schema/types.js";
import type { BaseProps } from "../types.js";

export const paginationSlots = ["root", "previous", "next", "page", "ellipsis"] as const;
export type PaginationSlot = (typeof paginationSlots)[number];

export const paginationStateTokens = [
	"focused",
	"focus-visible",
	"disabled",
	"selected",
] as const satisfies readonly StateToken[];
export type PaginationState = (typeof paginationStateTokens)[number];

export const paginationSlotStates = {
	root: [],
	previous: ["focused", "focus-visible", "disabled"],
	next: ["focused", "focus-visible", "disabled"],
	page: ["selected", "focused", "focus-visible", "disabled"],
	ellipsis: [],
} as const satisfies SlotStateMap<PaginationSlot, PaginationState>;

export interface PaginationRootProps extends Omit<HTMLAttributes<HTMLElement>, "style" | "children">, BaseProps {
	children?: Snippet;
}

export interface PaginationPreviousProps extends Omit<HTMLButtonAttributes, "style" | "children">, BaseProps {
	children?: Snippet;
}

export interface PaginationNextProps extends Omit<HTMLButtonAttributes, "style" | "children">, BaseProps {
	children?: Snippet;
}

export interface PaginationPageProps extends Omit<HTMLButtonAttributes, "style" | "children">, BaseProps {
	children?: Snippet;
}
