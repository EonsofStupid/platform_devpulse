/**
 * @file sys/bindings/devclyffy/index.ts
 * @description Clyffy umbrella status (system health roll-up).
 */

import { commands } from "$lib/sys/generated/bindings.js";

export const getStatus = commands.getStatus;

export type { HealthStatus, SystemHealth } from "$lib/sys/generated/bindings.js";
