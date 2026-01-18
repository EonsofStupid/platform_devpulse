/**
 * Debug Tools Registry
 * Central export for all dev-only debugging tools.
 * Feature-gated via DEBUG_FLAG.
 */

export { __DEV__, isDev } from './DEBUG_FLAG';

// VPB (Visual Page Builder)
export { VPB, vpb, dnd, scan } from './vpb';
export type { VPBMode, DropEffect, ElementInfo } from './vpb';
