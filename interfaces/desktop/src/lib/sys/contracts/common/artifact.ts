/**
 * @file sys/contracts/common/artifact.ts
 * @layer contracts
 *
 * ARTIFACT MODEL - PLATFORM SSOT
 * Every artifact in the system conforms to this contract.
 *
 * @since 1.0.0
 */

import { type } from "arktype";

// ============================================
// ARTIFACT KINDS
// ============================================

export const artifactKinds = [
	"token",
	"primitive",
	"recipe",
	"composite",
	"block",
	"pattern",
] as const;

export const ArtifactKindContract = type.enumerated(...artifactKinds);

export type ArtifactKind = (typeof artifactKinds)[number];

// ============================================
// HUB IDENTITY
// ============================================

export const hubIds = ["common", "wiredfront", "devpulse"] as const;

export const HubIdContract = type.enumerated(...hubIds);

export type HubId = (typeof hubIds)[number];

// ============================================
// ARTIFACT ID FORMAT
// ============================================

/**
 * Artifact ID format: `${HubId}:${ArtifactKind}:${name}`
 *
 * Examples:
 * - "common:primitive:button"
 * - "common:block:widget.shell"
 * - "devpulse:block:widget.engineHealth"
 * - "wiredfront:composite:chatPanel"
 */
export type ArtifactId = `${HubId}:${ArtifactKind}:${string}`;

export const ArtifactIdContract = type(
	new RegExp(`^(${hubIds.join("|")}):(${artifactKinds.join("|")}):.+$`),
);

// ============================================
// ARTIFACT ENTRY
// ============================================

export const ArtifactEntryContract = type({
	/** Unique artifact ID in format hub:kind:name */
	id: ArtifactIdContract,
	/** Hub this artifact belongs to */
	hub: HubIdContract,
	/** Kind of artifact */
	kind: ArtifactKindContract,
	/** Human-readable name */
	name: "string > 0",
	/** Description of the artifact */
	"description?": "string",
	/** Version when introduced (semver or date) */
	"since?": "string",
	/** Tags for categorization */
	"tags?": "string[]",
});

export type ArtifactEntry = Readonly<{
	id: ArtifactId;
	hub: HubId;
	kind: ArtifactKind;
	name: string;
	description?: string;
	since?: string;
	tags?: readonly string[];
}>;

// ============================================
// HELPERS
// ============================================

export function isArtifactKind(value: unknown): value is ArtifactKind {
	return ArtifactKindContract.allows(value);
}

export function isHubId(value: unknown): value is HubId {
	return HubIdContract.allows(value);
}

export function parseArtifactId(id: ArtifactId): { hub: HubId; kind: ArtifactKind; name: string } {
	const [hub, kind, ...rest] = id.split(":");
	return {
		hub: HubIdContract.assert(hub),
		kind: ArtifactKindContract.assert(kind),
		name: rest.join(":"),
	};
}

export function createArtifactId(hub: HubId, kind: ArtifactKind, name: string): ArtifactId {
	return `${hub}:${kind}:${name}`;
}
