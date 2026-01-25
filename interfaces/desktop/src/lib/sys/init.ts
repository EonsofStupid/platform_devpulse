/**
 * @file sys/init.ts
 * @description Initialize sys layer - register all domains
 */

import { domainRegistry } from './registries/index.js';
import { APP_DOMAINS } from './contracts/domains/app/index.js';

/** Initialize the sys layer */
export function initSys(): void {
  // Register all app domains
  APP_DOMAINS.forEach(domain => {
    domainRegistry.register(domain.id, domain);
  });
}

/** Check if sys is initialized */
export function isSysInitialized(): boolean {
  return domainRegistry.getIds().length > 0;
}
