/**
 * @file sys/contracts/domains/app/overmind/overmind.contract.ts
 * @description OverMind domain contracts
 */

import type { DomainMetadata } from '../../../routing/domain.contract.js';

/** OverMind domain metadata constant */
export const OVERMIND_DOMAIN: DomainMetadata = {
  id: 'overmind',
  label: 'OverMind',
  icon: '🧠',
  status: 'coming-soon',
  pageModule: '$lib/domains/app/overmind/OvermindDashboard.svelte',
  order: 2,
};
