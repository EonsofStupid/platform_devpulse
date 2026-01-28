/**
 * @file sys/index.ts
 * @module @devpulse/sys
 * @description System layer barrel export
 */

// Initialization
export { initSys, isSysInitialized } from './init';

// Existing exports
export { appState } from './app_state.svelte';
export { flags } from './cfg/flags';
export type { FeatureFlags } from './cfg/flags';

// Global state
export { global } from './runes/global.svelte';

// Debug tools (dev-only)
export * from './debug/index';
