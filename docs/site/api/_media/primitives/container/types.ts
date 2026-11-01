/**
 * @file primitives/container/types.ts
 * @kind container
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Container primitive — max-width wrapper with responsive breakpoints.
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { StateToken, SlotStateMap } from "../_schema/types.js";
import type { BaseProps } from "../types.js";

export const containerSlots = ["root"] as const;
export type ContainerSlot = (typeof containerSlots)[number];

export const containerStateTokens = [] as const satisfies readonly StateToken[];
export type ContainerState = (typeof containerStateTokens)[number];

export const containerSlotStates = {
	root: [],
} as const satisfies SlotStateMap<ContainerSlot, ContainerState>;

export interface ContainerProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">, BaseProps {
	children?: Snippet;
}
