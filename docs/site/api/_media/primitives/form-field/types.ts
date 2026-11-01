/**
 * @file primitives/form-field/types.ts
 * @kind form-field
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * FormField primitive — wrapper: label + input + description + error.
 * Compound primitive — provides context to child slots.
 *
 * ariaStateProvider: "coldlight"
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { StateToken, SlotStateMap } from "../_schema/types.js";
import type { BaseProps } from "../types.js";

export const formFieldSlots = ["root", "label", "control", "description", "error"] as const;
export type FormFieldSlot = (typeof formFieldSlots)[number];

export const formFieldStateTokens = [
	"invalid",
	"valid",
	"required",
	"disabled",
] as const satisfies readonly StateToken[];
export type FormFieldState = (typeof formFieldStateTokens)[number];

export const formFieldSlotStates = {
	root: ["invalid", "valid", "required", "disabled"],
	label: ["required", "disabled"],
	control: ["invalid", "valid", "required", "disabled"],
	description: [],
	error: ["invalid"],
} as const satisfies SlotStateMap<FormFieldSlot, FormFieldState>;

export interface FormFieldProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">, BaseProps {
	children?: Snippet;
}
