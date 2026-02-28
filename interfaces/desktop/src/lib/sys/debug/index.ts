/**
 * @file src/lib/sys/debug/index.ts
 * @module @devpulse/sys/debug/index
 * @layer lib
 *
 * Debug Tools Registry
 * Central export for all dev-only debugging tools.
 * Feature-gated via DEBUG_FLAG.
 *
 * @since 1.0.0
 */

export { __DEV__, isDev } from "./DEBUG_FLAG";
export { Vpb, vpbDocument, vpbPalette, vpbConnection } from "./vpb/index.js";
