/**
 * @file sys/contracts/domains/app/devforge/devforge.contract.ts
 * @description DevForge domain contracts
 */

import type { DomainMetadata } from '../../../routing/domain.contract.js';

/** DevForge domain metadata constant */
export const DEVFORGE_DOMAIN: DomainMetadata = {
  id: 'devforge',
  label: 'DevForge',
  icon: '🔧',
  status: 'hidden',
  pageModule: '$lib/domains/app/devforge/pages/DevDashboard.svelte',
  order: 10,
};
