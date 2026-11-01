/**
 * @file primitives/dropdown-menu/types.ts
 * @kind dropdown-menu
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Dropdown Menu primitive — menu with disclosure trigger.
 * ariaStateProvider: "meltui" — MeltUI adapter handles ARIA via new DropdownMenu().
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/menu/
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes, HTMLButtonAttributes } from "svelte/elements";
import type { StateToken, SlotStateMap } from "../_schema/types.js";
import type { BaseProps } from "../types.js";

export const dropdownMenuSlots = ["trigger", "content", "item", "separator", "group", "label", "checkbox-item", "radio-item", "sub-trigger", "sub-content"] as const;
export type DropdownMenuSlot = (typeof dropdownMenuSlots)[number];

export const dropdownMenuStateTokens = [
	"focused",
	"focus-visible",
	"hover",
	"disabled",
	"open",
	"closed",
	"checked",
] as const satisfies readonly StateToken[];
export type DropdownMenuState = (typeof dropdownMenuStateTokens)[number];

export const dropdownMenuSlotStates = {
	trigger: ["focused", "focus-visible", "open", "closed"],
	content: ["open", "closed"],
	item: ["focused", "hover", "disabled"],
	separator: [],
	group: [],
	label: [],
	"checkbox-item": ["checked", "focused", "hover", "disabled"],
	"radio-item": ["checked", "focused", "hover", "disabled"],
	"sub-trigger": ["focused", "hover", "open", "closed"],
	"sub-content": ["open", "closed"],
} as const satisfies SlotStateMap<DropdownMenuSlot, DropdownMenuState>;

export interface DropdownMenuTriggerProps extends Omit<HTMLButtonAttributes, "style" | "children">, BaseProps {
	children?: Snippet;
}

export interface DropdownMenuContentProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">, BaseProps {
	children?: Snippet;
}

export interface DropdownMenuItemProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">, BaseProps {
	children?: Snippet;
}
