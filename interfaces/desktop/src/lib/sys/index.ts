/**
 * @file sys/index.ts
 * @module @devpulse/sys
 * @description System layer barrel export
 */

export type { FeatureFlags } from "./cfg/flags.js";

// Feature flags
export { flags } from "./cfg/flags.js";
// Debug tools (dev-only)
export * from "./debug/index.js";
// Initialization
export { initSys, isSysInitialized } from "./init.js";
