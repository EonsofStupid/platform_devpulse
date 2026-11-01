/**
 * @file primitives/tree/types.ts
 * @kind tree
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Tree primitive type declarations — structural props, slot/state vocabularies.
 * Lives WITH the implementation per ColdLight architecture (locked 2026-02-21).
 *
 * ariaStateProvider: "meltui" — MeltUI adapter handles ARIA + state via transport chain.
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/treeview/
 * Builder: new Tree()
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { StateToken, SlotStateMap } from "../_schema/types.js";
import type { BaseProps } from "../types.js";

// =============================================================================
// SLOT VOCABULARY
// =============================================================================

/** Slot names for the tree primitive */
export const treeSlots = ["root", "item"] as const;
export type TreeSlot = (typeof treeSlots)[number];

// =============================================================================
// STATE VOCABULARY
// =============================================================================

/** State tokens applicable to the tree primitive */
export const treeStateTokens = [
	"expanded",
	"collapsed",
	"selected",
	"focused",
	"focus-visible",
	"hover",
	"disabled",
] as const satisfies readonly StateToken[];
export type TreeState = (typeof treeStateTokens)[number];

// =============================================================================
// SLOT STATE MAP
// =============================================================================

/** Maps each tree slot to its allowed state tokens */
export const treeSlotStates = {
	root: [],
	item: ["expanded", "collapsed", "selected", "focused", "focus-visible", "hover", "disabled"],
} as const satisfies SlotStateMap<TreeSlot, TreeState>;

// =============================================================================
// COMPONENT PROPS — structural shell only
// =============================================================================

/**
 * TreeRootProps — props for the tree root slot.
 *
 * Zero ARIA. Zero state logic. Zero styling.
 * The component layer applies ARIA + data-state + recipe classes.
 */
export interface TreeRootProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">,
		BaseProps {
	children?: Snippet;
}

/**
 * TreeItemProps — props for each tree item slot.
 */
export interface TreeItemProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">,
		BaseProps {
	children?: Snippet;
}
