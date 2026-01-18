/**
 * @fileoverview index.ts
 * @file src/lib/sys/index.ts
 * @module @devpulse/sys/index
 * @layer lib
 *
 * @description
 * [TODO: Describe the purpose and responsibility of this module]
 *
 * @dependencies
 * - [TODO: List imports this file depends on]
 *
 * @consumers
 * - [TODO: List modules that import this file]
 *
 * @vpb-editable [TODO: List props VPB can modify, or 'none']
 * @since 1.0.0
 */

/**
 * Sys Module
 * Barrel export for all system modules.
 */

// App State
export { appState } from './app_state.svelte';

// Runes (global state)
export { global } from './runes/global.svelte';

// Debug tools (dev-only)
export * from './debug';
