/**
 * @fileoverview index.ts
 * @file src/lib/sys/debug/index.ts
 * @module @devpulse/sys/debug/index
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
 * Debug Tools Registry
 * Central export for all dev-only debugging tools.
 * Feature-gated via DEBUG_FLAG.
 */

export { __DEV__, isDev } from './DEBUG_FLAG';

// VPB (Visual Page Builder)
export { VPB, vpb, dnd, scan } from './vpb';
export type { VPBMode, DropEffect, ElementInfo } from './vpb';
