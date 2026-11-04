/**
 * @file sys/registries/index.ts
 * @module @devpulse/sys/registries
 * @description Barrel export for all system registries
 *
 * Routes have no registry: they are the folders, read by `sys/routing`.
 */

// Base registry
export { BaseRegistry } from "./base.registry.js";

// Routing registries
export { domainRegistry } from "./routing/domain.registry.js";

// State registries
export { stateModuleOf, stateRegistry } from "./state/state.registry.js";

// Stream registries
export { streamsRegistry } from "./streams/streams.registry.js";
