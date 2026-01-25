/**
 * @file sys/contracts/domains/app/devpulse/devpulse.contract.ts
 * @description DevPulse domain contracts
 */

import type { DomainMetadata } from '../../../routing/domain.contract.js';

/** DevPulse feature identifiers */
export type DevPulseFeature =
  | 'dashboard'
  | 'community'
  | 'profile'
  | 'settings';

/** DevPulse domain metadata constant */
export const DEVPULSE_DOMAIN: DomainMetadata = {
  id: 'devpulse',
  label: 'DevPulse',
  icon: '🏠',
  status: 'active',
  pageModule: '$lib/domains/app/devpulse/features/dashboard/pages/DevPulseDashboard.svelte',
  defaultFeature: 'dashboard',
  order: 0,
};
