/**
 * @file design/taxonomy/api/adapter/meltui/types.ts
 * @layer taxonomy
 *
 * MeltUI adapter exists ONLY to translate provider → ColdLight runtime shape.
 * It must declare support and mapping tables.
 */

import type { ColdLightPrimitiveKind } from '../coldlight/types.js';

export type MeltUIAdapterId = 'meltui';

export type MeltUIAdapterEntry<K extends ColdLightPrimitiveKind> = {
  kind: K;

  /** Which _internal file implements it (required 1:1 mapping) */
  internalImpl: string;

  /** Provider state strings → ColdLight normalized states */
  stateMap: Record<string, string>;

  /** Provider slot names → ColdLight normalized slots */
  slotMap: Record<string, string>;
};

export type MeltUIAdapterRegistry = Record<ColdLightPrimitiveKind, MeltUIAdapterEntry<ColdLightPrimitiveKind>>;
