/**
 * @file api/adapters/meltui/_internal/tree/factory.ts
 * @package @devpulse/coldlight
 *
 * MeltUI Tree Factory — ONLY file that imports from `melt` for tree.
 * Wraps melt v0.44 Tree class (class-based builder API).
 *
 * ColdLight cloaks this entirely. Consumers NEVER import from melt or this file.
 * All access is via the transport layer (_transport/).
 *
 * Note: Melt v0.44 Tree requires I extends TreeItem = { id: string; children?: TreeItem[] }.
 * Tree constructor requires props (not optional) — items is mandatory.
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/treeview/
 */

import { Tree, type TreeProps, type TreeItem } from "melt/builders";

export type { TreeItem };
export type MeltTreeInstance<I extends TreeItem, Multiple extends boolean = false> = Tree<I, Multiple>;
export type MeltTreeConfig<I extends TreeItem, Multiple extends boolean = false> = TreeProps<I, Multiple>;

/**
 * Create a MeltUI Tree instance.
 * This is the ONLY place `Tree` from `melt/builders` is instantiated.
 */
export function createMeltTree<I extends TreeItem, Multiple extends boolean = false>(
	config: MeltTreeConfig<I, Multiple>,
): MeltTreeInstance<I, Multiple> {
	return new Tree(config);
}
