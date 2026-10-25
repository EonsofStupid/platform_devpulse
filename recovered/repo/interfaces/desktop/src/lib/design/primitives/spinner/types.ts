/**
 * @file primitives/spinner/types.ts
 * @kind spinner
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Spinner primitive — loading indicator with size/color tokens.
 *
 * ariaStateProvider: "coldlight"
 */

import type { HTMLAttributes } from "svelte/elements";
import type { StateToken, SlotStateMap } from "../_schema/types.js";
import type { BaseProps } from "../types.js";

export const spinnerSlots = ["root"] as const;
export type SpinnerSlot = (typeof spinnerSlots)[number];

export const spinnerStateTokens = [] as const satisfies readonly StateToken[];
export type SpinnerState = (typeof spinnerStateTokens)[number];

export const spinnerSlotStates = {
	root: [],
} as const satisfies SlotStateMap<SpinnerSlot, SpinnerState>;

export interface SpinnerProps extends Omit<HTMLAttributes<HTMLDivElement>, "style">, BaseProps {}
