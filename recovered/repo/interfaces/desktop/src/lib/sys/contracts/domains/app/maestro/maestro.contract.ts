/**
 * @file sys/contracts/domains/app/maestro/maestro.contract.ts
 * @description Maestro domain contracts
 */

import type { DomainMetadata } from '../../../routing/domain.contract.js';

/** Maestro domain metadata constant */
export const MAESTRO_DOMAIN: DomainMetadata = {
  id: 'maestro',
  label: 'Maestro',
  icon: '🎭',
  status: 'hidden',
  order: 11,
};
