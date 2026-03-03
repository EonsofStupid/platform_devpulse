/**
 * @file Tree Adapter Contract
 * @package @devpulse/coldlight
 *
 * Maps MeltUI Tree → ColdLight tree primitive contract.
 * This is the SSOT for how MeltUI's Tree class fulfills ColdLight's
 * tree primitive specification.
 *
 * Scanner validates this against primitives/tree/contract.ts at build time:
 * - Every required slot in primitive contract has a mapping here
 * - Every required ARIA attr per slot is declared in aria.required
 * - Every keyboard key in primitive contract is covered
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/treeview/
 *
 * WIRING STATUS:
 * - Component at components/tree/ DOES NOT EXIST — no component folder at all.
 * - TO WIRE: Create components/tree/ with Tree.svelte, types.ts, contract.ts,
 *   recipe.ts, index.ts, and tests. The component should import
 *   createTreeTransport from the transport layer, spread transport.slots.root
 *   onto the root div, spread transport.slots.group onto group containers,
 *   iterate transport.children recursively, spreading child.item onto each
 *   tree item element. Use transport.states.selected / transport.states.expanded
 *   for state. MeltUI handles all ARIA (role="tree", role="treeitem",
 *   aria-expanded, aria-selected, aria-level, etc.) and keyboard navigation.
 */

import type { AdapterContract } from "../../../_schema/types.js";

export const adapterContract = {
	kind: "tree",
	source: "meltui",
	meltClass: "Tree",
	meltImport: "melt/builders",
	compound: true,

	// ─── Root Slots ──────────────────────────────────────────────────────────
	slots: {
		root: {
			meltGetter: "root",
			coldlightSlot: "root",
			element: "div",
			aria: {
				role: "tree",
				required: [],
				optional: ["aria-label", "aria-labelledby", "aria-multiselectable"],
			},
			states: [],
			dataAttributes: ["data-cl-tree-root"],
		},
	},

	// ─── Per-Item Slots (compound) ───────────────────────────────────────────
	itemSlots: {
		item: {
			meltGetter: "child.attrs",
			coldlightSlot: "item",
			element: "div",
			aria: {
				role: "treeitem",
				required: ["aria-expanded", "aria-selected"],
				optional: ["aria-level", "aria-setsize", "aria-posinset", "aria-disabled"],
			},
			states: ["expanded", "collapsed", "selected", "focused", "focus-visible", "hover", "disabled"],
			dataAttributes: ["data-cl-tree-item"],
		},
		group: {
			meltGetter: "group",
			coldlightSlot: "group",
			element: "div",
			aria: {
				role: "group",
				required: [],
				optional: [],
			},
			states: [],
			dataAttributes: ["data-cl-tree-group"],
		},
	},

	// ─── Props ───────────────────────────────────────────────────────────────
	props: [
		{
			meltProp: "items",
			coldlightProp: "items",
			type: "TreeItem[]",
			required: true,
		},
		{
			meltProp: "multiple",
			coldlightProp: "multiple",
			type: "boolean",
			required: false,
			defaultValue: false,
		},
		{
			meltProp: "expandOnClick",
			coldlightProp: "expandOnClick",
			type: "boolean",
			required: false,
			defaultValue: true,
		},
		{
			meltProp: "typeaheadTimeout",
			coldlightProp: "typeaheadTimeout",
			type: "number",
			required: false,
			defaultValue: 500,
		},
	],

	// ─── Keyboard (WAI-ARIA APG: Treeview) ───────────────────────────────────
	keyboard: [
		{ key: "ArrowDown", action: "next-item", description: "Move focus to next visible treeitem", slot: "item" },
		{ key: "ArrowUp", action: "prev-item", description: "Move focus to previous visible treeitem", slot: "item" },
		{ key: "ArrowLeft", action: "collapse-or-parent", description: "Collapse expanded node or move focus to parent", slot: "item" },
		{ key: "ArrowRight", action: "expand-or-child", description: "Expand collapsed node or move focus to first child", slot: "item" },
		{ key: "Home", action: "first-item", description: "Move focus to first treeitem", slot: "item" },
		{ key: "End", action: "last-item", description: "Move focus to last visible treeitem", slot: "item" },
		{ key: "Enter", action: "activate", description: "Activate the focused treeitem", slot: "item" },
		{ key: "Space", action: "toggle-select", description: "Toggle selection of the focused treeitem", slot: "item" },
	],
} as const satisfies AdapterContract<"tree">;
