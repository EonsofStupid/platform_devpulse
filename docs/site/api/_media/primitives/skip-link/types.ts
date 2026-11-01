/**
 * @file primitives/skip-link/types.ts
 * @kind skip-link
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * SkipLink primitive — accessibility skip-to-content link.
 * Visually hidden until focused, jumps to main content.
 *
 * ariaStateProvider: "coldlight"
 */

import type { Snippet } from "svelte";
import type { HTMLAnchorAttributes } from "svelte/elements";
import type { StateToken, SlotStateMap } from "../_schema/types.js";
import type { BaseProps } from "../types.js";

export const skipLinkSlots = ["root"] as const;
export type SkipLinkSlot = (typeof skipLinkSlots)[number];

export const skipLinkStateTokens = [
	"focused",
	"focus-visible",
] as const satisfies readonly StateToken[];
export type SkipLinkState = (typeof skipLinkStateTokens)[number];

export const skipLinkSlotStates = {
	root: ["focused", "focus-visible"],
} as const satisfies SlotStateMap<SkipLinkSlot, SkipLinkState>;

export interface SkipLinkProps extends Omit<HTMLAnchorAttributes, "style" | "children">, BaseProps {
	children?: Snippet;
}
