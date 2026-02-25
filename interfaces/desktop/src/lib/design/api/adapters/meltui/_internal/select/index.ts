/**
 * @file api/adapters/meltui/_internal/select/index.ts
 * @package @devpulse/coldlight
 *
 * MeltUI select _internal barrel.
 * This is the ONLY allowed import path from outside this folder.
 * Components import createSelectTransport from here — NEVER from melt directly.
 */

export { createSelectTransport } from "./_transport/index.js";
export type {
	SelectTransport,
	SelectTransportConfig,
	SelectTransportRefs,
	SelectTransportStates,
} from "./_transport/index.js";
export { createMeltSelect, type MeltSelectConfig, type MeltSelectInstance } from "./factory.js";
