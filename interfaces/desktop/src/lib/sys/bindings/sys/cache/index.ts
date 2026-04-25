/**
 * @file sys/bindings/sys/cache/index.ts
 * @description Moka in-memory cache devtool surface.
 */

import { commands } from "$lib/sys/generated/bindings.js";

export const cacheHealth = commands.cacheHealth;

export type { CacheHealth, CacheStats } from "$lib/sys/generated/bindings.js";
