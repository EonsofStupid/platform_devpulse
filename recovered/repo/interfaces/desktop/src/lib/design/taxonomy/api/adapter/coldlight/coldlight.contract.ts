/**
 * @file design/taxonomy/api/adapter/coldlight/coldlight.contract.ts
 * @layer taxonomy
 *
 * ColdLight contract: stable runtime "shape" primitives depend on.
 * Providers MUST conform to this output.
 */

import type { ColdLightPrimitiveKind, ColdLightPrimitiveRuntime } from './types.js';

export type ColdLightContract = {
  getRuntime<K extends ColdLightPrimitiveKind>(kind: K): ColdLightPrimitiveRuntime<K>;
};
