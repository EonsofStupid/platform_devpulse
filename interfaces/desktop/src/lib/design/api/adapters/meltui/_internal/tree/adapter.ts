/**
 * @file api/adapters/meltui/_internal/tree/adapter.ts
 * @package @devpulse/coldlight
 *
 * MeltUI Tree adapter — wraps the MeltUI Tree builder into AdapterResult.
 *
 * Tree is a compound component: root and group are static slots, but
 * item-level slots are accessed via the children array (Child instances).
 * We expose tree manipulation methods via context.
 */

import type { AdapterResult } from "../../../_schema/engine.js";
import { createMeltTree, type MeltTreeConfig, type TreeItem } from "./factory.js";

export function createAdapter(props?: Record<string, unknown>): AdapterResult {
	const builder = createMeltTree(props as MeltTreeConfig<TreeItem>);

	return {
		states: {
			selected: {
				get current() {
					const sel = builder.selected;
					if (typeof sel === "object" && sel !== null && "size" in sel) return (sel as Set<string>).size > 0;
					return sel !== undefined;
				},
				set current(_v: boolean) {
					// selection is managed via context methods
				},
			},
			expanded: {
				get current() {
					return builder.expanded.size > 0;
				},
				set current(_v: boolean) {
					// expansion is managed via context methods
				},
			},
		},
		attrs: {
			root: {
				get role() {
					return builder.root.role;
				},
				get "data-melt-tree-root"() {
					return builder.root["data-melt-tree-root"];
				},
			},
			group: {
				get role() {
					return builder.group.role;
				},
				get "data-melt-tree-group"() {
					return builder.group["data-melt-tree-group"];
				},
			},
		},
		handlers: {
			root: {},
			group: {},
		},
		context: {
			/**
			 * Returns the top-level Child instances. Each Child has .attrs
			 * (with id, role, tabindex, data-selected, onclick, onkeydown)
			 * and .children for nested items.
			 */
			get children() {
				return builder.children;
			},

			/** Get the items array */
			get items() {
				return builder.items;
			},

			/** Get an item by id from the collection */
			getItem: (id: string) => builder.getItem(id),
			/** Get the DOM ID for a specific tree item */
			getItemId: (id: string) => builder.getItemId(id),
			/** Get the DOM element for a specific tree item */
			getItemEl: (id: string) => builder.getItemEl(id),

			/** Check if an item is selected */
			isSelected: (id: string) => builder.isSelected(id),
			/** Check if an item is expanded */
			isExpanded: (id: string) => builder.isExpanded(id),

			/** Selection methods */
			select: (id: string) => builder.select(id),
			deselect: (id: string) => builder.deselect(id),
			toggleSelect: (id: string) => builder.toggleSelect(id),
			selectAll: () => builder.selectAll(),
			clearSelection: () => builder.clearSelection(),
			selectUntil: (id: string) => builder.selectUntil(id),

			/** Expansion methods */
			expand: (id: string) => builder.expand(id),
			expandAll: () => builder.expandAll(),
			collapse: (id: string) => builder.collapse(id),
			collapseAll: () => builder.collapseAll(),
			toggleExpand: (id: string) => builder.toggleExpand(id),

			/** Direct access to selected for controlled scenarios */
			get selected() {
				return builder.selected;
			},
			set selected(v) {
				builder.selected = v;
			},

			/** Direct access to expanded for controlled scenarios */
			get expanded() {
				return builder.expanded;
			},
			set expanded(v) {
				builder.expanded = v;
			},
		},
	};
}
