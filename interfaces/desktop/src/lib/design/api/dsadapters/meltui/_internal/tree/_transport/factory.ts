/**
 * @file api/adapters/meltui/_internal/tree/_transport/factory.ts
 * @package @devpulse/coldlight
 *
 * Creates a ColdLight tree transport from melt v0.44 Tree.
 * Maps melt Tree getters → ColdLight slot vocabulary.
 *
 * Melt v0.44 Tree exposes direct getter properties:
 *   tree.root     → slots.root  (role=tree, data-melt-*)
 *   tree.group    → slots.group (role=group, data-melt-*)
 *   tree.children → Child<I>[] with .attrs getter per child
 *
 * Melt uses SvelteSet<string> for expanded/selected (multi).
 * This transport converts to/from plain Set<string>/string[] at the boundary.
 */

import { SvelteSet } from "svelte/reactivity";
import type { SlotAttrs } from "$lib/design/api/dsadapters/coldlight/_internal/_transport/types.js";
import { createMeltTree, type TreeItem } from "../factory.js";
import type {
	ColdLightTreeItem,
	TreeTransport,
	TreeTransportConfig,
	TreeChildTransport,
} from "./types.js";

/**
 * Recursively map melt tree children to ColdLight TreeChildTransport.
 * Melt Child<I> has .attrs (slot attrs), .children (Child<I>[] | undefined),
 * .selected, .expanded, .canExpand.
 */
function mapChildren(meltChildren: readonly {
	attrs: unknown;
	children: readonly unknown[] | undefined;
	selected: boolean;
	expanded: boolean;
	canExpand: boolean;
}[]): readonly TreeChildTransport[] {
	return meltChildren.map((child) => ({
		get item(): SlotAttrs {
			return child.attrs as unknown as SlotAttrs;
		},
		get children(): readonly TreeChildTransport[] {
			if (!child.children) return [];
			return mapChildren(child.children as typeof meltChildren);
		},
		get selected(): boolean {
			return child.selected;
		},
		get expanded(): boolean {
			return child.expanded;
		},
		get canExpand(): boolean {
			return child.canExpand;
		},
	}));
}

/**
 * Create a ColdLight tree transport wrapping melt v0.44 Tree.
 *
 * Usage in component:
 * ```svelte
 * const transport = createTreeTransport({ items: treeData });
 *
 * <div {...transport.slots.root}>
 *   {#each transport.children as child}
 *     <div {...child.item}>
 *       {#if child.canExpand}
 *         <div {...transport.slots.group}>
 *           {#each child.children as nested}
 *             <div {...nested.item}></div>
 *           {/each}
 *         </div>
 *       {/if}
 *     </div>
 *   {/each}
 * </div>
 * ```
 */
export function createTreeTransport<
	I extends ColdLightTreeItem = ColdLightTreeItem,
	Multiple extends boolean = false,
>(
	config: TreeTransportConfig<I, Multiple>,
): TreeTransport<Multiple> {
	const tree = createMeltTree<I & TreeItem, Multiple>({
		items: config.items as (I & TreeItem)[],
		multiple: config.multiple,
		expandOnClick: config.expandOnClick,
		typeaheadTimeout: config.typeaheadTimeout,
	});

	return {
		slots: {
			get root(): SlotAttrs {
				return tree.root as unknown as SlotAttrs;
			},
			get group(): SlotAttrs {
				return tree.group as unknown as SlotAttrs;
			},
		},
		states: {
			get selected() {
				const raw = tree.selected;
				if (raw instanceof SvelteSet) {
					return [...raw] as unknown as TreeTransport<Multiple>["states"]["selected"];
				}
				return raw as unknown as TreeTransport<Multiple>["states"]["selected"];
			},
			set selected(v) {
				if (Array.isArray(v)) {
					tree.selected = new SvelteSet(v) as unknown as typeof tree.selected;
				} else {
					tree.selected = v as unknown as typeof tree.selected;
				}
			},
			get expanded(): Set<string> {
				return tree.expanded;
			},
			set expanded(v: Set<string>) {
				tree.expanded = v instanceof SvelteSet ? v : new SvelteSet(v);
			},
		},
		get children(): readonly TreeChildTransport[] {
			return mapChildren(tree.children as unknown as Parameters<typeof mapChildren>[0]);
		},
	};
}
