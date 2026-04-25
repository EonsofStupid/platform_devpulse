/**
 * @file sys/bindings/sys/scoped-log/index.ts
 * @description Per-prefix scoped log tail (every devtool calls this).
 */

import { commands } from "$lib/sys/generated/bindings.js";

export const queryScopedLog = commands.queryScopedLog;

export type { ScopedLogEntry } from "$lib/sys/generated/bindings.js";
