/**
 * @file primitives/grid/types.ts
 * @kind grid
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Grid primitive — CSS Grid container with columns/rows/gap tokens.
 *
 * ariaStateProvider: "coldlight" — native HTML semantics.
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { StateToken, SlotStateMap } from "../_schema/types.js";
import type { BaseProps } from "../types.js";

export const gridSlots = ["root"] as const;
export type GridSlot = (typeof gridSlots)[number];

export const gridStateTokens = [] as const satisfies readonly StateToken[];
export type GridState = (typeof gridStateTokens)[number];

export const gridSlotStates = {
	root: [],
} as const satisfies SlotStateMap<GridSlot, GridState>;

export interface GridProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">, BaseProps {
	children?: Snippet;
}
