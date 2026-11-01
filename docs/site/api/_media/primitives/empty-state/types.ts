/**
 * @file primitives/empty-state/types.ts
 * @kind empty-state
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * EmptyState primitive — placeholder for empty content areas.
 * ariaStateProvider: "coldlight"
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { StateToken, SlotStateMap } from "../_schema/types.js";
import type { BaseProps } from "../types.js";

export const emptyStateSlots = ["root", "icon", "title", "description", "action"] as const;
export type EmptyStateSlot = (typeof emptyStateSlots)[number];

export const emptyStateStateTokens = [] as const satisfies readonly StateToken[];
export type EmptyStateState = (typeof emptyStateStateTokens)[number];

export const emptyStateSlotStates = {
	root: [],
	icon: [],
	title: [],
	description: [],
	action: [],
} as const satisfies SlotStateMap<EmptyStateSlot, EmptyStateState>;

export interface EmptyStateProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">, BaseProps {
	children?: Snippet;
}
