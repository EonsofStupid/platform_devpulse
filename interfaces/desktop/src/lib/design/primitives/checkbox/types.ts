/**
 * @file primitives/checkbox/types.ts
 * @kind checkbox
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Checkbox primitive — toggle control with tri-state support.
 *
 * ariaStateProvider: "coldlight" — ColdLight owns ARIA directly.
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/
 */

import type { Snippet } from "svelte";
import type { HTMLButtonAttributes } from "svelte/elements";
import type { StateToken, SlotStateMap } from "../_schema/types.js";
import type { BaseProps } from "../types.js";

export const checkboxSlots = ["root", "indicator", "label"] as const;
export type CheckboxSlot = (typeof checkboxSlots)[number];

export const checkboxStateTokens = [
	"checked",
	"indeterminate",
	"focused",
	"focus-visible",
	"hover",
	"disabled",
] as const satisfies readonly StateToken[];
export type CheckboxState = (typeof checkboxStateTokens)[number];

export const checkboxSlotStates = {
	root: ["checked", "indeterminate", "focused", "focus-visible", "hover", "disabled"],
	indicator: ["checked", "indeterminate"],
	label: ["disabled"],
} as const satisfies SlotStateMap<CheckboxSlot, CheckboxState>;

export interface CheckboxRootProps extends Omit<HTMLButtonAttributes, "style" | "children">, BaseProps {
	children?: Snippet;
	/** Controlled checked state */
	checked?: boolean;
	/** Indeterminate (mixed) state */
	indeterminate?: boolean;
}
