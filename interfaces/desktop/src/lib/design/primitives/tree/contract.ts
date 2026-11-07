/**
 * @file primitives/tree/contract.ts
 * @kind tree
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Tree PrimitiveContract — SSOT declaration for the tree primitive.
 * Lives WITH the implementation per ColdLight architecture (locked 2026-02-21).
 *
 * ariaStateProvider: "meltui"
 *   MeltUI adapter handles ARIA + state via transport chain.
 *   3-folder parity enforced by scanner.
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/treeview/
 * Builder: new Tree()
 */

import type { PrimitiveContract } from "../_schema/types.js";
import type { TreeSlot, TreeState } from "./types.js";

export const contract = {
	kind: "tree",
	ariaStateProvider: "meltui",

	// ─── Slots ───────────────────────────────────────────────────────────────
	slots: {
		required: ["root", "item"],
		optional: [],
		forbidden: [],
	},

	slotSpec: {
		root: {
			element: "div",
			children: "snippet",
			aria: {
				role: "tree",
				required: [],
				optional: ["aria-label", "aria-labelledby", "aria-multiselectable"],
			},
		},
		item: {
			element: "div",
			children: "snippet",
			aria: {
				role: "treeitem",
				required: ["aria-expanded", "aria-selected"],
				optional: ["aria-level", "aria-setsize", "aria-posinset", "aria-disabled"],
			},
		},
	},

	// ─── State ───────────────────────────────────────────────────────────────
	states: {
		shared: ["selected", "focused", "focus-visible", "hover", "disabled"],
		specific: ["expanded", "collapsed"],
	},

	slotStates: {
		root: [],
		item: ["expanded", "collapsed", "selected", "focused", "focus-visible", "hover", "disabled"],
	},

	slotActions: {
		root: [],
		item: ["expand", "collapse", "toggle", "select"],
	},

	// ─── ARIA ─────────────────────────────────────────────────────────────────
	aria: {
		role: "tree",
		requiredAttrs: [],
		optionalAttrs: ["aria-label", "aria-labelledby", "aria-multiselectable"],
	},

	// ─── Keyboard (WAI-ARIA APG: Treeview) ────────────────────────────────────
	// ArrowDown: moves focus to next visible treeitem
	// ArrowUp: moves focus to previous visible treeitem
	// ArrowLeft: collapses expanded node or moves to parent
	// ArrowRight: expands collapsed node or moves to first child
	// Home: moves focus to first treeitem
	// End: moves focus to last visible treeitem
	// Enter: activates the focused treeitem
	// Space: toggles selection of the focused treeitem
	keyboard: ["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight", "Home", "End", "Enter", "Space"],

	// ─── Behavior ─────────────────────────────────────────────────────────────
	focusStrategy: "roving",
	compound: true,
	orientation: "vertical",
} as const satisfies PrimitiveContract<"tree", TreeSlot, TreeState>;
