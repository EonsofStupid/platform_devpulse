/**
 * @file sys/registries/index.ts
 * @module @devpulse/sys/registries
 * @description Barrel export for all system registries
 */

// Base registry
export { BaseRegistry } from './base.registry.js';

// Core registries
export { domainRegistry } from './core/domain.registry.js';

// Routing registries
export { routesRegistry } from './routing/routes.registry.js';

// State registries
export { stateRegistry } from './state/state.registry.js';

// Stream registries
export { streamsRegistry } from './streams/streams.registry.js';
