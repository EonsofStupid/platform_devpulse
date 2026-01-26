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
  order: 1,
};
