/**
 * @file primitives/badge/types.ts
 * @kind badge
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Badge primitive — status/label indicator, variant-driven.
 *
 * ariaStateProvider: "coldlight"
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { StateToken, SlotStateMap } from "../_schema/types.js";
import type { BaseProps } from "../types.js";

export const badgeSlots = ["root"] as const;
export type BadgeSlot = (typeof badgeSlots)[number];

export const badgeStateTokens = [] as const satisfies readonly StateToken[];
export type BadgeState = (typeof badgeStateTokens)[number];

export const badgeSlotStates = {
	root: [],
} as const satisfies SlotStateMap<BadgeSlot, BadgeState>;

export interface BadgeProps extends Omit<HTMLAttributes<HTMLSpanElement>, "style" | "children">, BaseProps {
	children?: Snippet;
}
