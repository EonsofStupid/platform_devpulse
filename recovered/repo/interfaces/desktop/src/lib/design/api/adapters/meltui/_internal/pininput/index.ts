/**
 * @file api/adapters/meltui/_internal/pininput/index.ts
 * @package @devpulse/coldlight
 *
 * MeltUI pin input _internal barrel.
 * This is the ONLY allowed import path from outside this folder.
 * Components import createPinInputTransport from here — NEVER from melt directly.
 */

export { createPinInputTransport } from "./_transport/index.js";
export type {
	PinInputTransport,
	PinInputTransportConfig,
	PinInputTransportStates,
} from "./_transport/index.js";
export { createMeltPinInput, type MeltPinInputConfig, type MeltPinInputInstance } from "./factory.js";
