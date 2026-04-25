/**
 * @file sys/bindings/sys/logger/index.ts
 * @description Frontend → Rust tracing bridge (one fire-and-forget cmd).
 */

import { commands } from "$lib/sys/generated/bindings.js";

export const log = commands.log;
