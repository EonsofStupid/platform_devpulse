/**
 * @file Block Factory — Create BlockNodes
 * @layer blocks
 * @package @devpulse/coldlight
 *
 * Factory function for creating new BlockNode instances.
 * Looks up the catalog for default style IDs, generates unique IDs.
 *
 * Block and document IDs are persisted (saved documents, exports), so they
 * are random UUIDs: `idGen` counts per page load, and a saved `blk-2` met a
 * fresh `blk-2` after a reload.
 * Style presets are resolved at build time (SD5 DTCG pipeline), not here.
 */

import type { BlockNode } from "./schema.js";

/**
 * Create a new BlockNode for a given kind.
 * Default style is always `{kind}-default`. Preset overrides.
 */
export function createBlockNode(kind: string, presetId?: string): BlockNode {
	const styleId = presetId ?? `${kind}-default`;

	return {
		id: `blk-${crypto.randomUUID()}`,
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
		id: `doc-${crypto.randomUUID()}`,
		version: 1,
		label,
		root: [],
		createdAt: now,
		updatedAt: now,
	};
}
