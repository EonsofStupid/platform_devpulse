/**
 * @file design/api/adapters/meltui/_internal/types.ts
 * @layer internal
 *
 * Internal types for MeltUI → ColdLight runtime mapping.
 */

import type { ColdLightPrimitiveKind } from '$lib/design/taxonomy/api/adapter/coldlight/index.js';

/**
 * Runtime parts that get spread onto elements.
 * Every slot gets data attributes for styling hooks.
 */
export type ColdLightRuntimeParts = {
  root: Record<string, unknown>;
  [slot: string]: Record<string, unknown>;
};

/**
 * Internal adapter interface for a primitive kind.
 * Each primitive must implement this to map MeltUI → ColdLight.
 */
export type MeltUIInternalAdapter<K extends ColdLightPrimitiveKind> = {
  kind: K;
  build(options?: Record<string, unknown>): ColdLightRuntimeParts;
};
