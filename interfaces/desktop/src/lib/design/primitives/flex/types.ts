/**
 * @file primitives/flex/types.ts
 * @kind flex
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Flex primitive — flexbox container with gap/align/justify tokens.
 *
 * ariaStateProvider: "coldlight" — native HTML semantics.
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { StateToken, SlotStateMap } from "../_schema/types.js";
import type { BaseProps } from "../types.js";

export const flexSlots = ["root"] as const;
export type FlexSlot = (typeof flexSlots)[number];

export const flexStateTokens = [] as const satisfies readonly StateToken[];
export type FlexState = (typeof flexStateTokens)[number];

export const flexSlotStates = {
	root: [],
} as const satisfies SlotStateMap<FlexSlot, FlexState>;

export interface FlexProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">, BaseProps {
	children?: Snippet;
	as?: "div" | "section" | "article" | "aside" | "nav" | "header" | "footer";
}
