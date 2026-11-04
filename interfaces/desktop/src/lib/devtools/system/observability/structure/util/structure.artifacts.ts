/**
 * @file The artifact catalog: ColdLight's primitives and the Builder's blocks.
 * @module @devpulse/devtools/system/observability/structure
 *
 * Each entry's id is validated against the artifact contract. Both lists are
 * read from where those artifacts live; nothing here names one by hand.
 */

import { PRIMITIVES } from "@devpulse/coldlight/primitives";
import {
	type ArtifactEntry,
	ArtifactEntryContract,
	type ArtifactId,
	createArtifactId,
	parseArtifactId,
} from "#lib/sys/contracts/index.js";
import { paletteItems } from "#lib/sys/debug/vpb/components/builder/palette.js";

function entryOf(id: ArtifactId): ArtifactEntry {
	const entry = { id, ...parseArtifactId(id) };
	ArtifactEntryContract.assert(entry);
	return entry;
}

/** Every primitive and block, by its platform-wide id. */
export const ARTIFACTS: readonly ArtifactEntry[] = [
	...PRIMITIVES.map((primitive) =>
		entryOf(createArtifactId("common", "primitive", primitive.kind)),
	),
	...paletteItems.map((item) => entryOf(item.id)),
];
