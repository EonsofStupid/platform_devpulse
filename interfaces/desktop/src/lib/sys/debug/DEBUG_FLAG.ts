/**
 * @fileoverview DEBUG_FLAG.ts
 * @file src/lib/sys/debug/DEBUG_FLAG.ts
 * @module @devpulse/sys/debug/DEBUG_FLAG
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
 * DEBUG_FLAG.ts
 * Feature gate for dev-only tools.
 * This constant is statically analyzed by Vite and stripped in production builds.
 * 
 * Usage:
 * ```ts
 * import { __DEV__ } from '$lib/sys/debug/DEBUG_FLAG';
 * if (__DEV__) { ... }
 * ```
 */

export const __DEV__ = import.meta.env.DEV;

/**
 * Type guard for dev-only code blocks.
 * Use this for conditional compilation patterns.
 */
export function isDev(): boolean {
  return import.meta.env.DEV;
}
