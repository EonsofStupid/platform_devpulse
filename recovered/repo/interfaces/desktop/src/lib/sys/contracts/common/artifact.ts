/**
 * @file sys/contracts/common/artifact.ts
 * @layer contracts
 *
 * ARTIFACT MODEL - PLATFORM SSOT
 * Every artifact in the system conforms to this contract.
 *
 * @since 1.0.0
 */

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

export type ArtifactKind = (typeof artifactKinds)[number];

// ============================================
// HUB IDENTITY
// ============================================

export const hubIds = ["common", "wiredfront", "devpulse"] as const;

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

// ============================================
// ARTIFACT ENTRY
// ============================================

export type ArtifactEntry = Readonly<{
  /** Unique artifact ID in format hub:kind:name */
  id: ArtifactId;
  /** Hub this artifact belongs to */
  hub: HubId;
  /** Kind of artifact */
  kind: ArtifactKind;
  /** Human-readable name */
  name: string;
  /** Description of the artifact */
  description?: string;
  /** Version when introduced (semver or date) */
  since?: string;
  /** Tags for categorization */
  tags?: readonly string[];
}>;

// ============================================
// HELPERS
// ============================================

export function isArtifactKind(value: unknown): value is ArtifactKind {
  return typeof value === "string" && artifactKinds.includes(value as ArtifactKind);
}

export function isHubId(value: unknown): value is HubId {
  return typeof value === "string" && hubIds.includes(value as HubId);
}

export function parseArtifactId(id: ArtifactId): { hub: HubId; kind: ArtifactKind; name: string } {
  const [hub, kind, ...rest] = id.split(":");
  return {
    hub: hub as HubId,
    kind: kind as ArtifactKind,
    name: rest.join(":"),
  };
}

export function createArtifactId(hub: HubId, kind: ArtifactKind, name: string): ArtifactId {
  return `${hub}:${kind}:${name}`;
}
