/**
 * @file Block Factory — Create BlockNodes
 * @layer blocks
 * @package @devpulse/coldlight
 *
 * Factory function for creating new BlockNode instances.
 * Looks up the catalog for default style IDs, generates unique IDs.
 * Style presets are resolved at build time (SD5 DTCG pipeline), not here.
 */

import catalogData from "$lib/design/generated/ui-catalog.json" with { type: "json" };
import { idGen } from "$lib/design/utils/idGen.js";
import type { BlockNode } from "./schema.js";

/**
 * Create a new BlockNode for a given kind.
 * Uses the catalog's defaultStyleId as the initial preset.
 */
export function createBlockNode(kind: string, presetId?: string): BlockNode {
	const entry = catalogData.elements.find((e: { kind: string }) => e.kind === kind);
	const styleId = presetId ?? (entry as { defaultStyleId?: string })?.defaultStyleId ?? `${kind}-default`;

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
