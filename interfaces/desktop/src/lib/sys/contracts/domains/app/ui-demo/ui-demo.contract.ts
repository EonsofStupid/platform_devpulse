/**
 * @file sys/contracts/domains/app/ui-demo/ui-demo.contract.ts
 * @description UI Demo domain contracts
 */

import type { DomainMetadata } from '../../../routing/domain.contract.js';

/** UI Demo domain metadata constant */
export const UIDEMO_DOMAIN: DomainMetadata = {
  id: 'ui-demo',
  label: 'UI Components',
  icon: '🎨',
  status: 'active',
  pageModule: '$lib/domains/app/ui-demo/pages/UIDemoPage.svelte',
  order: 1,
};
