/**
 * @file primitives/context-menu/types.ts
 * @kind context-menu
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Context Menu primitive — menu triggered by right-click.
 * ariaStateProvider: "meltui" — MeltUI adapter handles ARIA via new ContextMenu().
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/menu/
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes, HTMLButtonAttributes } from "svelte/elements";
import type { StateToken, SlotStateMap } from "../_schema/types.js";
import type { BaseProps } from "../types.js";

export const contextMenuSlots = ["trigger", "content", "item", "separator", "group", "label", "checkbox-item", "radio-item", "sub-trigger", "sub-content"] as const;
export type ContextMenuSlot = (typeof contextMenuSlots)[number];

export const contextMenuStateTokens = [
	"focused",
	"focus-visible",
	"hover",
	"disabled",
	"open",
	"closed",
	"checked",
] as const satisfies readonly StateToken[];
export type ContextMenuState = (typeof contextMenuStateTokens)[number];

export const contextMenuSlotStates = {
	trigger: ["open", "closed"],
	content: ["open", "closed"],
	item: ["focused", "hover", "disabled"],
	separator: [],
	group: [],
	label: [],
	"checkbox-item": ["checked", "focused", "hover", "disabled"],
	"radio-item": ["checked", "focused", "hover", "disabled"],
	"sub-trigger": ["focused", "hover", "open", "closed"],
	"sub-content": ["open", "closed"],
} as const satisfies SlotStateMap<ContextMenuSlot, ContextMenuState>;

export interface ContextMenuTriggerProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">, BaseProps {
	children?: Snippet;
}

export interface ContextMenuContentProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">, BaseProps {
	children?: Snippet;
}

export interface ContextMenuItemProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">, BaseProps {
	children?: Snippet;
}
