/**
 * @file sys/bindings/sys/metrics/index.ts
 * @description Process-level metrics snapshot.
 */

import { commands } from "#lib/sys/generated/bindings.js";

export const getProcessMetrics = commands.getProcessMetrics;

export type { ProcessMetrics } from "#lib/sys/generated/bindings.js";
