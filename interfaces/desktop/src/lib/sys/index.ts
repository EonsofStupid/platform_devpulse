/**
 * @file sys/index.ts
 * @module @devpulse/sys
 * @description System layer barrel export
 */

// Contracts (types only)
export type * from './contracts/index.js';

// Domain contracts (values - for registration)
export { APP_DOMAINS, DEVPULSE_DOMAIN, UIDEMO_DOMAIN, OVERMIND_DOMAIN, WIREDFRONT_DOMAIN, DEVFORGE_DOMAIN, MAESTRO_DOMAIN } from './contracts/index.js';

// Registries (singleton instances)
export { BaseRegistry, domainRegistry, routesRegistry, stateRegistry, streamsRegistry } from './registries/index.js';

// Initialization
export { initSys, isSysInitialized } from './init.js';

// Existing exports
export { appState } from './app_state.svelte.js';
export { flags } from './cfg/flags.js';
export type { FeatureFlags } from './cfg/flags.js';

// Global state
export { global } from './global/runes/global.svelte.js';

// Debug tools (dev-only)
export * from './debug/index.js';
