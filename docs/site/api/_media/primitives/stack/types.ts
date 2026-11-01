/**
 * @file primitives/stack/types.ts
 * @kind stack
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Stack primitive — vertical flex shorthand with tokenized gap.
 *
 * ariaStateProvider: "coldlight" — native HTML semantics.
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { StateToken, SlotStateMap } from "../_schema/types.js";
import type { BaseProps } from "../types.js";

export const stackSlots = ["root"] as const;
export type StackSlot = (typeof stackSlots)[number];

export const stackStateTokens = [] as const satisfies readonly StateToken[];
export type StackState = (typeof stackStateTokens)[number];

export const stackSlotStates = {
	root: [],
} as const satisfies SlotStateMap<StackSlot, StackState>;

export interface StackProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">, BaseProps {
	children?: Snippet;
}
