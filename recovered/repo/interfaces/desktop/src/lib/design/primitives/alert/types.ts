/**
 * @file primitives/alert/types.ts
 * @kind alert
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Alert primitive — static alert banner (info/warning/error/success).
 * WAI-ARIA: role="alert" provides implicit aria-live="assertive".
 *
 * ariaStateProvider: "coldlight"
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { StateToken, SlotStateMap } from "../_schema/types.js";
import type { BaseProps } from "../types.js";

export const alertSlots = ["root", "icon", "title", "description", "action"] as const;
export type AlertSlot = (typeof alertSlots)[number];

export const alertStateTokens = [] as const satisfies readonly StateToken[];
export type AlertState = (typeof alertStateTokens)[number];

export const alertSlotStates = {
	root: [],
	icon: [],
	title: [],
	description: [],
	action: [],
} as const satisfies SlotStateMap<AlertSlot, AlertState>;

export interface AlertProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">, BaseProps {
	children?: Snippet;
}
