/**
 * @file primitives/menubar/types.ts
 * @kind menubar
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Menubar primitive — horizontal menu bar with dropdown menus.
 * ariaStateProvider: "meltui" — MeltUI adapter handles ARIA via new Menubar().
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/menubar/
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes, HTMLButtonAttributes } from "svelte/elements";
import type { StateToken, SlotStateMap } from "../_schema/types.js";
import type { BaseProps } from "../types.js";

export const menubarSlots = ["root", "menu", "trigger", "content", "item", "separator", "group", "label", "checkbox-item", "radio-item", "sub-trigger", "sub-content"] as const;
export type MenubarSlot = (typeof menubarSlots)[number];

export const menubarStateTokens = [
	"focused",
	"focus-visible",
	"hover",
	"disabled",
	"open",
	"closed",
	"checked",
] as const satisfies readonly StateToken[];
export type MenubarState = (typeof menubarStateTokens)[number];

export const menubarSlotStates = {
	root: [],
	menu: ["open", "closed"],
	trigger: ["focused", "focus-visible", "open", "closed", "hover"],
	content: ["open", "closed"],
	item: ["focused", "hover", "disabled"],
	separator: [],
	group: [],
	label: [],
	"checkbox-item": ["checked", "focused", "hover", "disabled"],
	"radio-item": ["checked", "focused", "hover", "disabled"],
	"sub-trigger": ["focused", "hover", "open", "closed"],
	"sub-content": ["open", "closed"],
} as const satisfies SlotStateMap<MenubarSlot, MenubarState>;

export interface MenubarRootProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">, BaseProps {
	children?: Snippet;
}

export interface MenubarTriggerProps extends Omit<HTMLButtonAttributes, "style" | "children">, BaseProps {
	children?: Snippet;
}

export interface MenubarContentProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">, BaseProps {
	children?: Snippet;
}

export interface MenubarItemProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">, BaseProps {
	children?: Snippet;
}
