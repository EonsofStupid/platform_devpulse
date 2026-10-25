/**
 * @file primitives/card/types.ts
 * @kind card
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Card primitive — content container with header/body/footer sections.
 * ariaStateProvider: "coldlight"
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { StateToken, SlotStateMap } from "../_schema/types.js";
import type { BaseProps } from "../types.js";

export const cardSlots = ["root", "header", "body", "footer"] as const;
export type CardSlot = (typeof cardSlots)[number];

export const cardStateTokens = [] as const satisfies readonly StateToken[];
export type CardState = (typeof cardStateTokens)[number];

export const cardSlotStates = {
	root: [],
	header: [],
	body: [],
	footer: [],
} as const satisfies SlotStateMap<CardSlot, CardState>;

export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">, BaseProps {
	children?: Snippet;
}
