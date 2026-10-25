/**
 * @file primitives/heading/types.ts
 * @kind heading
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Heading primitive — h1-h6 with semantic level decoupled from visual scale.
 * `level` sets the HTML tag (h1-h6). Visual scale applied via recipe class.
 *
 * ariaStateProvider: "coldlight" — native heading semantics.
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { StateToken, SlotStateMap } from "../_schema/types.js";
import type { BaseProps } from "../types.js";

export const headingSlots = ["root"] as const;
export type HeadingSlot = (typeof headingSlots)[number];

export const headingStateTokens = [] as const satisfies readonly StateToken[];
export type HeadingState = (typeof headingStateTokens)[number];

export const headingSlotStates = {
	root: [],
} as const satisfies SlotStateMap<HeadingSlot, HeadingState>;

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface HeadingProps extends Omit<HTMLAttributes<HTMLHeadingElement>, "style" | "children">, BaseProps {
	children?: Snippet;
	/** Semantic heading level — determines HTML tag (h1-h6) */
	level?: HeadingLevel;
}
