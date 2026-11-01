/**
 * @file primitives/switch/types.ts
 * @kind switch
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Switch primitive — on/off toggle.
 *
 * ariaStateProvider: "coldlight"
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/switch/
 */

import type { Snippet } from "svelte";
import type { HTMLButtonAttributes } from "svelte/elements";
import type { StateToken, SlotStateMap } from "../_schema/types.js";
import type { BaseProps } from "../types.js";

export const switchSlots = ["root", "thumb", "label"] as const;
export type SwitchSlot = (typeof switchSlots)[number];

export const switchStateTokens = [
	"checked",
	"focused",
	"focus-visible",
	"hover",
	"disabled",
] as const satisfies readonly StateToken[];
export type SwitchState = (typeof switchStateTokens)[number];

export const switchSlotStates = {
	root: ["checked", "focused", "focus-visible", "hover", "disabled"],
	thumb: ["checked"],
	label: ["disabled"],
} as const satisfies SlotStateMap<SwitchSlot, SwitchState>;

export interface SwitchRootProps extends Omit<HTMLButtonAttributes, "style" | "children">, BaseProps {
	children?: Snippet;
	checked?: boolean;
}
