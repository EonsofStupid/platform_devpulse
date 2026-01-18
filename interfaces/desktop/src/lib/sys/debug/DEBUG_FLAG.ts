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
