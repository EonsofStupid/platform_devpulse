/**
 * @file sys/contracts/domains/app/wiredfront/wiredfront.contract.ts
 * @description WiredFront domain contracts
 */

import type { DomainMetadata } from '../../../routing/domain.contract.js';

/** WiredFront feature identifiers */
export type WiredFrontFeature =
  | 'dashboard'
  | 'gallery'
  | 'connectorhub'
  | 'viziwizi';

/** WiredFront domain metadata constant */
export const WIREDFRONT_DOMAIN: DomainMetadata = {
  id: 'wiredfront',
  label: 'WiredFront',
  icon: '📡',
  status: 'coming-soon',
  pageModule: '$lib/domains/app/wiredfront/pages/WiredDashboard.svelte',
  defaultFeature: 'dashboard',
  order: 3,
};
