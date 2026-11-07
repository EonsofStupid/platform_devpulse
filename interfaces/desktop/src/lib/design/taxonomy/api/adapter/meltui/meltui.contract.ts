/**
 * @file design/taxonomy/api/adapter/meltui/meltui.contract.ts
 * @layer taxonomy
 *
 * MeltUI adapter contract = must fully satisfy ColdLight contract output.
 */

import type { ColdLightContract } from '../coldlight/coldlight.contract.js';
import type { ColdLightPrimitiveKind } from '../coldlight/types.js';
import type { MeltUIAdapterEntry } from './types.js';

export type MeltUIContract = ColdLightContract & {
  provider: 'meltui';

  /** The mapping registry MUST exist (no hidden behavior) */
  registry: Record<ColdLightPrimitiveKind, MeltUIAdapterEntry<ColdLightPrimitiveKind>>;
};
