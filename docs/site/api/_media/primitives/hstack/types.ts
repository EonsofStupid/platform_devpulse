/**
 * @file primitives/hstack/types.ts
 * @kind hstack
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * HStack primitive — horizontal flex shorthand with tokenized gap.
 *
 * ariaStateProvider: "coldlight" — native HTML semantics.
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { StateToken, SlotStateMap } from "../_schema/types.js";
import type { BaseProps } from "../types.js";

export const hstackSlots = ["root"] as const;
export type HStackSlot = (typeof hstackSlots)[number];

export const hstackStateTokens = [] as const satisfies readonly StateToken[];
export type HStackState = (typeof hstackStateTokens)[number];

export const hstackSlotStates = {
	root: [],
} as const satisfies SlotStateMap<HStackSlot, HStackState>;

export interface HStackProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">, BaseProps {
	children?: Snippet;
}
