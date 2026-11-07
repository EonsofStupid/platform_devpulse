/**
 * @file primitives/table-of-contents/types.ts
 * @kind table-of-contents
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * TableOfContents primitive — navigation list of document headings.
 * ariaStateProvider: "coldlight"
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes, HTMLAnchorAttributes } from "svelte/elements";
import type { StateToken, SlotStateMap } from "../_schema/types.js";
import type { BaseProps } from "../types.js";

export const tableOfContentsSlots = ["root", "item", "link"] as const;
export type TableOfContentsSlot = (typeof tableOfContentsSlots)[number];

export const tableOfContentsStateTokens = ["focused", "focus-visible", "active"] as const satisfies readonly StateToken[];
export type TableOfContentsState = (typeof tableOfContentsStateTokens)[number];

export const tableOfContentsSlotStates = {
	root: [],
	item: ["active"],
	link: ["focused", "focus-visible", "active"],
} as const satisfies SlotStateMap<TableOfContentsSlot, TableOfContentsState>;

export interface TableOfContentsRootProps extends Omit<HTMLAttributes<HTMLElement>, "style" | "children">, BaseProps {
	children?: Snippet;
}

export interface TableOfContentsItemProps extends Omit<HTMLAttributes<HTMLLIElement>, "style" | "children">, BaseProps {
	children?: Snippet;
}

export interface TableOfContentsLinkProps extends Omit<HTMLAnchorAttributes, "style" | "children">, BaseProps {
	children?: Snippet;
}
