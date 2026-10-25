/**
 * @file primitives/text/types.ts
 * @kind text
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Text primitive — base text rendering, polymorphic, token-driven scale.
 *
 * ariaStateProvider: "coldlight" — native inline semantics.
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { StateToken, SlotStateMap } from "../_schema/types.js";
import type { BaseProps } from "../types.js";

export const textSlots = ["root"] as const;
export type TextSlot = (typeof textSlots)[number];

export const textStateTokens = [] as const satisfies readonly StateToken[];
export type TextState = (typeof textStateTokens)[number];

export const textSlotStates = {
	root: [],
} as const satisfies SlotStateMap<TextSlot, TextState>;

export interface TextProps extends Omit<HTMLAttributes<HTMLSpanElement>, "style" | "children">, BaseProps {
	children?: Snippet;
	/** Polymorphic element tag */
	as?: "span" | "p" | "div" | "label" | "strong" | "em" | "small";
}
