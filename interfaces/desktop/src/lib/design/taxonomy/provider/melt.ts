/**
 * @file taxonomy/provider/melt.ts
 * @layer taxonomy
 *
 * Melt UI provider implementation.
 */

import type { ProviderContract, BuilderCapabilities, ProviderInfo } from './types.js';

export const MELT_INFO: ProviderInfo = {
  id: 'melt-ui',
  name: 'Melt UI',
  version: '>=0.80.0',
} as const;

export const MELT_CAPABILITIES: BuilderCapabilities = {
  aria: true,
  focus: true,
  keyboard: true,
  clickOutside: true,
  escape: true,
  scrollLock: true,
  floating: true,
  portal: true,
  typeahead: true,
} as const;

export const MELT_PROVIDER: ProviderContract = {
  info: MELT_INFO,
  capabilities: MELT_CAPABILITIES,
  actionName: 'melt',
  importPath: '@melt-ui/svelte',
} as const;
