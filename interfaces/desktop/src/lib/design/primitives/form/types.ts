/**
 * @file primitives/form/types.ts
 * @kind form
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Form primitive — native <form> element with submit handling.
 *
 * ariaStateProvider: "coldlight" — native form semantics.
 */

import type { Snippet } from "svelte";
import type { HTMLFormAttributes } from "svelte/elements";
import type { StateToken, SlotStateMap } from "../_schema/types.js";
import type { BaseProps } from "../types.js";

export const formSlots = ["root"] as const;
export type FormSlot = (typeof formSlots)[number];

export const formStateTokens = [
	"pending",
	"disabled",
] as const satisfies readonly StateToken[];
export type FormState = (typeof formStateTokens)[number];

export const formSlotStates = {
	root: ["pending", "disabled"],
} as const satisfies SlotStateMap<FormSlot, FormState>;

export interface FormProps extends Omit<HTMLFormAttributes, "style" | "children">, BaseProps {
	children?: Snippet;
}
