/**
 * @file sys/contracts/domains/app/index.ts
 * @description Barrel export for app namespace domain contracts
 */

// Domain metadata constants
export { DEVPULSE_DOMAIN } from './devpulse/devpulse.contract.js';
export { UIDEMO_DOMAIN } from './ui-demo/ui-demo.contract.js';
export { OVERMIND_DOMAIN } from './overmind/overmind.contract.js';
export { WIREDFRONT_DOMAIN } from './wiredfront/wiredfront.contract.js';
export { DEVFORGE_DOMAIN } from './devforge/devforge.contract.js';
export { MAESTRO_DOMAIN } from './maestro/maestro.contract.js';

// Domain feature types
export type { DevPulseFeature } from './devpulse/devpulse.contract.js';
export type { WiredFrontFeature } from './wiredfront/wiredfront.contract.js';

// All domains array for registration
import { DEVPULSE_DOMAIN } from './devpulse/devpulse.contract.js';
import { UIDEMO_DOMAIN } from './ui-demo/ui-demo.contract.js';
import { OVERMIND_DOMAIN } from './overmind/overmind.contract.js';
import { WIREDFRONT_DOMAIN } from './wiredfront/wiredfront.contract.js';
import { DEVFORGE_DOMAIN } from './devforge/devforge.contract.js';
import { MAESTRO_DOMAIN } from './maestro/maestro.contract.js';

/** All app domains for bulk registration */
export const APP_DOMAINS = [
  DEVPULSE_DOMAIN,
  UIDEMO_DOMAIN,
  OVERMIND_DOMAIN,
  WIREDFRONT_DOMAIN,
  DEVFORGE_DOMAIN,
  MAESTRO_DOMAIN,
] as const;
