/**
 * @file src/lib/sys/debug/index.ts
 * @module @devpulse/sys/debug/index
 * @layer lib
 *
 * Debug Tools Registry
 * Central export for all dev-only debugging tools.
 * Feature-gated via DEBUG_FLAG.
 *
 * NOTE: VPB (Visual Page Builder) is removed pending foundation rebuild.
 * It will return once the ColdLight foundation is proven solid.
 *
 * @since 1.0.0
 */

export { __DEV__, isDev } from "./DEBUG_FLAG";
