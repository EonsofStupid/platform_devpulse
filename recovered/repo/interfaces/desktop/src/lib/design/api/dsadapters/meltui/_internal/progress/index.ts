/**
 * @file api/adapters/meltui/_internal/progress/index.ts
 * @package @devpulse/coldlight
 *
 * MeltUI progress _internal barrel.
 * This is the ONLY allowed import path from outside this folder.
 * Components import createProgressTransport from here — NEVER from melt directly.
 */

export { createProgressTransport } from "./_transport/index.js";
export type {
	ProgressTransport,
	ProgressTransportConfig,
	ProgressTransportStates,
} from "./_transport/index.js";
export { createMeltProgress, type MeltProgressConfig, type MeltProgressInstance } from "./factory.js";
