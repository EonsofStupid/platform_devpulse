/**
 * @file primitives/label/types.ts
 * @kind label
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Label primitive — native <label> element.
 * Associates with form controls via `for` attribute.
 *
 * ariaStateProvider: "coldlight" — native label semantics.
 */

import type { Snippet } from "svelte";
import type { HTMLLabelAttributes } from "svelte/elements";
import type { StateToken, SlotStateMap } from "../_schema/types.js";
import type { BaseProps } from "../types.js";

export const labelSlots = ["root"] as const;
export type LabelSlot = (typeof labelSlots)[number];

export const labelStateTokens = ["disabled"] as const satisfies readonly StateToken[];
export type LabelState = (typeof labelStateTokens)[number];

export const labelSlotStates = {
	root: ["disabled"],
} as const satisfies SlotStateMap<LabelSlot, LabelState>;

export interface LabelProps extends Omit<HTMLLabelAttributes, "style" | "children">, BaseProps {
	children?: Snippet;
}
