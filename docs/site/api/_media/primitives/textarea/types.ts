/**
 * @file primitives/textarea/types.ts
 * @kind textarea
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Textarea primitive — multi-line text input.
 *
 * ariaStateProvider: "coldlight"
 */

import type { HTMLTextareaAttributes } from "svelte/elements";
import type { StateToken, SlotStateMap } from "../_schema/types.js";
import type { BaseProps } from "../types.js";

export const textareaSlots = ["root"] as const;
export type TextareaSlot = (typeof textareaSlots)[number];

export const textareaStateTokens = [
	"focused",
	"focus-visible",
	"hover",
	"disabled",
	"readonly",
	"required",
	"invalid",
	"valid",
] as const satisfies readonly StateToken[];
export type TextareaState = (typeof textareaStateTokens)[number];

export const textareaSlotStates = {
	root: ["focused", "focus-visible", "hover", "disabled", "readonly", "required", "invalid", "valid"],
} as const satisfies SlotStateMap<TextareaSlot, TextareaState>;

export interface TextareaProps extends Omit<HTMLTextareaAttributes, "style">, BaseProps {}
