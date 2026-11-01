/**
 * @file primitives/input/types.ts
 * @kind input
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Input primitive — text input with size/variant tokens.
 *
 * ariaStateProvider: "coldlight" — native input semantics.
 */

import type { HTMLInputAttributes } from "svelte/elements";
import type { StateToken, SlotStateMap } from "../_schema/types.js";
import type { BaseProps } from "../types.js";

export const inputSlots = ["root"] as const;
export type InputSlot = (typeof inputSlots)[number];

export const inputStateTokens = [
	"focused",
	"focus-visible",
	"hover",
	"disabled",
	"readonly",
	"required",
	"invalid",
	"valid",
] as const satisfies readonly StateToken[];
export type InputState = (typeof inputStateTokens)[number];

export const inputSlotStates = {
	root: ["focused", "focus-visible", "hover", "disabled", "readonly", "required", "invalid", "valid"],
} as const satisfies SlotStateMap<InputSlot, InputState>;

export interface InputProps extends Omit<HTMLInputAttributes, "style">, BaseProps {}
