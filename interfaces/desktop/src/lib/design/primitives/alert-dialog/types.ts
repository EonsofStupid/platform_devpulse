/**
 * @file primitives/alert-dialog/types.ts
 * @kind alert-dialog
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Alert Dialog primitive — modal dialog requiring acknowledgment.
 * ariaStateProvider: "meltui" — MeltUI adapter handles ARIA via new AlertDialog().
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/alertdialog/
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes, HTMLButtonAttributes } from "svelte/elements";
import type { StateToken, SlotStateMap } from "../_schema/types.js";
import type { BaseProps } from "../types.js";

export const alertDialogSlots = ["trigger", "overlay", "content", "title", "description", "action", "cancel"] as const;
export type AlertDialogSlot = (typeof alertDialogSlots)[number];

export const alertDialogStateTokens = [
	"focused",
	"focus-visible",
	"open",
	"closed",
] as const satisfies readonly StateToken[];
export type AlertDialogState = (typeof alertDialogStateTokens)[number];

export const alertDialogSlotStates = {
	trigger: ["focused", "focus-visible"],
	overlay: ["open", "closed"],
	content: ["open", "closed"],
	title: [],
	description: [],
	action: ["focused", "focus-visible"],
	cancel: ["focused", "focus-visible"],
} as const satisfies SlotStateMap<AlertDialogSlot, AlertDialogState>;

export interface AlertDialogTriggerProps extends Omit<HTMLButtonAttributes, "style" | "children">, BaseProps {
	children?: Snippet;
}

export interface AlertDialogContentProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">, BaseProps {
	children?: Snippet;
}

export interface AlertDialogActionProps extends Omit<HTMLButtonAttributes, "style" | "children">, BaseProps {
	children?: Snippet;
}

export interface AlertDialogCancelProps extends Omit<HTMLButtonAttributes, "style" | "children">, BaseProps {
	children?: Snippet;
}
