/**
 * @file api/adapters/meltui/_internal/tree/_transport/factory.ts
 * @package @devpulse/coldlight
 *
 * Creates a ColdLight tree transport from melt v0.44 Tree.
 * Maps melt Tree getters → ColdLight slot vocabulary.
 *
 * Slot mapping:
 *   melt tree.root  → slots.root  (role=tree, data-melt-*)
 *   melt tree.group → slots.group (role=group, data-melt-*)
 *
 * Child mapping (recursive):
 *   melt child.item       → child.item       (role=treeitem, data-melt-*)
 *   melt child.children   → child.children   (recursive TreeChildTransport[])
 *   melt child.selected   → child.selected   (readonly boolean)
 *   melt child.expanded   → child.expanded   (readonly boolean)
 *   melt child.canExpand  → child.canExpand  (readonly boolean)
 *
 * State mapping:
 *   melt tree.selected → states.selected (get/set)
 *   melt tree.expanded → states.expanded (get/set)
 */

import type { SlotAttrs } from "$lib/design/api/adapters/coldlight/_internal/_transport/types.js";
import { createMeltTree } from "../factory.js";
import type {
	TreeTransport,
	TreeTransportConfig,
	TreeChildTransport,
} from "./types.js";

/**
 * Recursively map melt tree children to ColdLight TreeChildTransport.
 */
function mapChildren(meltChildren: readonly {
	item: unknown;
	children: readonly unknown[];
	selected: boolean;
	expanded: boolean;
	canExpand: boolean;
}[]): readonly TreeChildTransport[] {
	return meltChildren.map((child) => ({
		get item(): SlotAttrs {
			return child.item as unknown as SlotAttrs;
		},
		get children(): readonly TreeChildTransport[] {
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
 * const transport = createTreeTransport({ collection });
 *
 * <div {...transport.slots.root}>
 *   {#each transport.children as child}
 *     <div {...child.item}>
 *       {#if child.canExpand}
 *         <div {...transport.slots.group}>
 *           {#each child.children as nested}
 *             <div {...nested.item}>{nested.item["data-value"]}</div>
 *           {/each}
 *         </div>
 *       {/if}
 *     </div>
 *   {/each}
 * </div>
 * ```
 */
export function createTreeTransport<I, Multiple extends boolean = false>(
	config: TreeTransportConfig<I, Multiple>,
): TreeTransport<Multiple> {
	const tree = createMeltTree<I, Multiple>({
		collection: config.collection,
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
				return tree.selected as TreeTransport<Multiple>["states"]["selected"];
			},
			set selected(v) {
				tree.selected = v as typeof tree.selected;
			},
			get expanded(): Set<string> {
				return tree.expanded;
			},
			set expanded(v: Set<string>) {
				tree.expanded = v;
			},
		},
		get children(): readonly TreeChildTransport[] {
			return mapChildren(tree.children as unknown as Parameters<typeof mapChildren>[0]);
		},
	};
}
