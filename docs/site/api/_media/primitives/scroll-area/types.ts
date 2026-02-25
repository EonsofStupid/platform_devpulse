/**
 * @file primitives/scroll-area/types.ts
 * @kind scroll-area
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * ScrollArea primitive — custom scrollbar container with viewport.
 * ariaStateProvider: "coldlight"
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { StateToken, SlotStateMap } from "../_schema/types.js";
import type { BaseProps } from "../types.js";

export const scrollAreaSlots = ["root", "viewport", "scrollbar", "thumb"] as const;
export type ScrollAreaSlot = (typeof scrollAreaSlots)[number];

export const scrollAreaStateTokens = ["hover", "active"] as const satisfies readonly StateToken[];
export type ScrollAreaState = (typeof scrollAreaStateTokens)[number];

export const scrollAreaSlotStates = {
	root: [],
	viewport: [],
	scrollbar: ["hover", "active"],
	thumb: ["hover", "active"],
} as const satisfies SlotStateMap<ScrollAreaSlot, ScrollAreaState>;

export interface ScrollAreaRootProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">, BaseProps {
	children?: Snippet;
}

export interface ScrollAreaViewportProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">, BaseProps {
	children?: Snippet;
}

export interface ScrollAreaScrollbarProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">, BaseProps {
	children?: Snippet;
}

export interface ScrollAreaThumbProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">, BaseProps {
	children?: Snippet;
}
