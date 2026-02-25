/**
 * @file api/adapters/meltui/_internal/tree/_transport/types.ts
 * @package @devpulse/coldlight
 *
 * Typed transport interface for the MeltUI tree adapter.
 * Maps melt v0.44 Tree API → ColdLight slot vocabulary.
 *
 * Slots managed by melt: root, group, item (per child)
 * States: selected (string | string[]), expanded (Set<string>)
 *
 * Each tree child exposes its own item slot attrs and nested children.
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/treeview/
 */

import type {
	SlotAttrs,
	TransportAdapter,
} from "$lib/design/api/adapters/coldlight/_internal/_transport/types.js";

// =============================================================================
// TREE CHILD TRANSPORT — per-child interface
// =============================================================================

export interface TreeChildTransport {
	/** Slot attrs for the tree item element */
	readonly item: SlotAttrs;
	/** Nested children of this tree node */
	readonly children: readonly TreeChildTransport[];
	/** Whether this item is currently selected */
	readonly selected: boolean;
	/** Whether this item is currently expanded */
	readonly expanded: boolean;
	/** Whether this item has children and can be expanded */
	readonly canExpand: boolean;
}

// =============================================================================
// TRANSPORT STATES
// =============================================================================

export interface TreeTransportStates<Multiple extends boolean = false> {
	/** Currently selected item(s). Single string when multiple=false, string[] when multiple=true */
	selected: Multiple extends true ? string[] : string | undefined;
	/** Set of currently expanded node identifiers */
	expanded: Set<string>;
}

// =============================================================================
// TRANSPORT CONFIG
// =============================================================================

export interface TreeTransportConfig<I, Multiple extends boolean = false> {
	/** The tree collection data. Required. */
	collection: I;
	/** Whether multiple items can be selected. @default false */
	multiple?: Multiple;
	/** Whether clicking an item expands it. @default false */
	expandOnClick?: boolean;
	/** Timeout in ms for typeahead search. @default 750 */
	typeaheadTimeout?: number;
}

// =============================================================================
// TRANSPORT ADAPTER
// =============================================================================

/**
 * ColdLight tree transport — the public contract for the melt tree adapter.
 *
 * Slots (melt-managed): root, group
 * Children: array of TreeChildTransport (each with item slot + nested children)
 * States: selected, expanded
 */
export type TreeTransport<Multiple extends boolean = false> = TransportAdapter<
	"root" | "group",
	TreeTransportStates<Multiple>
> & {
	readonly slots: {
		readonly root: SlotAttrs;
		readonly group: SlotAttrs;
	};
	/** Top-level tree children with item slots and nested children */
	readonly children: readonly TreeChildTransport[];
};
