/**
 * @file Block Factory — Create BlockNodes
 * @layer blocks
 * @package @devpulse/coldlight
 *
 * Factory function for creating new BlockNode instances.
 * Looks up the catalog for default style IDs, generates unique IDs.
 * Style presets are resolved at build time (SD5 DTCG pipeline), not here.
 */

import { idGen } from "$lib/design/utils/idGen.js";
import type { BlockNode } from "./schema.js";

/**
 * Create a new BlockNode for a given kind.
 * Default style is always `{kind}-default`. Preset overrides.
 */
export function createBlockNode(kind: string, presetId?: string): BlockNode {
	const styleId = presetId ?? `${kind}-default`;

	return {
		id: idGen("blk"),
		kind,
		recipe: styleId,
		props: {},
	};
}

/**
 * Create an empty BlockDocument.
 */
export function createBlockDocument(label = "Untitled"): {
	id: string;
	version: 1;
	label: string;
	root: BlockNode[];
	createdAt: string;
	updatedAt: string;
} {
	const now = new Date().toISOString();
	return {
		id: idGen("doc"),
		version: 1,
		label,
		root: [],
		createdAt: now,
		updatedAt: now,
	};
}
