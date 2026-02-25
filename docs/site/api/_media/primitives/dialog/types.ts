/**
 * @file primitives/dialog/types.ts
 * @kind dialog
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Dialog primitive — modal dialog overlay.
 * ariaStateProvider: "meltui" — MeltUI adapter handles ARIA via new Dialog().
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes, HTMLButtonAttributes } from "svelte/elements";
import type { StateToken, SlotStateMap } from "../_schema/types.js";
import type { BaseProps } from "../types.js";

export const dialogSlots = ["trigger", "overlay", "content", "title", "description", "close"] as const;
export type DialogSlot = (typeof dialogSlots)[number];

export const dialogStateTokens = [
	"open",
	"closed",
	"focused",
	"focus-visible",
] as const satisfies readonly StateToken[];
export type DialogState = (typeof dialogStateTokens)[number];

export const dialogSlotStates = {
	trigger: ["focused", "focus-visible"],
	overlay: ["open", "closed"],
	content: ["open", "closed"],
	title: [],
	description: [],
	close: ["focused", "focus-visible"],
} as const satisfies SlotStateMap<DialogSlot, DialogState>;

export interface DialogTriggerProps extends Omit<HTMLButtonAttributes, "style" | "children">, BaseProps {
	children?: Snippet;
}

export interface DialogContentProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">, BaseProps {
	children?: Snippet;
}
