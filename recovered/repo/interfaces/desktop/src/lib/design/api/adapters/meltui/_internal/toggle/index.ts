/**
 * @file api/adapters/meltui/_internal/toggle/index.ts
 * @package @devpulse/coldlight
 *
 * MeltUI toggle _internal barrel.
 * This is the ONLY allowed import path from outside this folder.
 * Components import createToggleTransport from here — NEVER from melt directly.
 */

export { createToggleTransport } from "./_transport/index.js";
export type {
	ToggleTransport,
	ToggleTransportConfig,
	ToggleTransportStates,
} from "./_transport/index.js";
export { createMeltToggle, type MeltToggleConfig, type MeltToggleInstance } from "./factory.js";
