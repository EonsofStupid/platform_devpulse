/**
 * @file api/adapters/meltui/_internal/radiogroup/index.ts
 * @package @devpulse/coldlight
 *
 * MeltUI radio group _internal barrel.
 * This is the ONLY allowed import path from outside this folder.
 * Components import createRadioGroupTransport from here — NEVER from melt directly.
 */

export { createRadioGroupTransport } from "./_transport/index.js";
export type {
	RadioGroupTransport,
	RadioGroupTransportConfig,
	RadioGroupTransportStates,
} from "./_transport/index.js";
export { createMeltRadioGroup, type MeltRadioGroupConfig, type MeltRadioGroupInstance } from "./factory.js";
