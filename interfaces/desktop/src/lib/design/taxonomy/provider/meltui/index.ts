/**
 * @file taxonomy/provider/index.ts
 * @layer taxonomy
 *
 * Provider exports.
 */

export type {
  ProviderId,
  ProviderInfo,
  BuilderCapabilities,
  ProviderContract,
} from './types.js';

export {
  BUILDER_MAP,
  getBuilderName,
  isMeltPrimitive,
} from './types.js';

export {
  MELT_INFO,
  MELT_CAPABILITIES,
  MELT_PROVIDER,
} from './melt.js';

// Active provider
export { MELT_PROVIDER as ACTIVE_PROVIDER } from './melt.js';
