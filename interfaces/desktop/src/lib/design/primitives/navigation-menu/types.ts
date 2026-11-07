/**
 * @file primitives/navigation-menu/types.ts
 * @kind navigation-menu
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Navigation Menu primitive — site navigation with expandable sub-menus.
 * ariaStateProvider: "coldlight" — ColdLight owns all ARIA directly.
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes, HTMLButtonAttributes, HTMLAnchorAttributes } from "svelte/elements";
import type { StateToken, SlotStateMap } from "../_schema/types.js";
import type { BaseProps } from "../types.js";

export const navigationMenuSlots = ["root", "list", "item", "trigger", "content", "link"] as const;
export type NavigationMenuSlot = (typeof navigationMenuSlots)[number];

export const navigationMenuStateTokens = [
	"focused",
	"focus-visible",
	"hover",
	"disabled",
	"open",
	"closed",
	"active",
] as const satisfies readonly StateToken[];
export type NavigationMenuState = (typeof navigationMenuStateTokens)[number];

export const navigationMenuSlotStates = {
	root: [],
	list: [],
	item: ["open", "closed", "active"],
	trigger: ["focused", "focus-visible", "hover", "open", "closed", "disabled"],
	content: ["open", "closed"],
	link: ["focused", "focus-visible", "hover", "active", "disabled"],
} as const satisfies SlotStateMap<NavigationMenuSlot, NavigationMenuState>;

export interface NavigationMenuRootProps extends Omit<HTMLAttributes<HTMLElement>, "style" | "children">, BaseProps {
	children?: Snippet;
}

export interface NavigationMenuItemProps extends Omit<HTMLAttributes<HTMLLIElement>, "style" | "children">, BaseProps {
	children?: Snippet;
	/** Value identifier for this menu item */
	value?: string;
}

export interface NavigationMenuTriggerProps extends Omit<HTMLButtonAttributes, "style" | "children">, BaseProps {
	children?: Snippet;
}

export interface NavigationMenuContentProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">, BaseProps {
	children?: Snippet;
}

export interface NavigationMenuLinkProps extends Omit<HTMLAnchorAttributes, "style" | "children">, BaseProps {
	children?: Snippet;
	/** Whether this link is currently active */
	active?: boolean;
}
