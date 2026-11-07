/**
 * @file api/adapters/meltui/_internal/toaster/index.ts
 * @package @devpulse/coldlight
 *
 * MeltUI toaster _internal barrel.
 * This is the ONLY allowed import path from outside this folder.
 * Components import createToasterTransport from here — NEVER from melt directly.
 */

export { createToasterTransport } from "./_transport/index.js";
export type {
	ToasterTransport,
	ToasterTransportConfig,
	ToasterTransportStates,
	ToastTransport,
} from "./_transport/index.js";
export { createMeltToaster, type MeltToasterConfig, type MeltToasterInstance } from "./factory.js";
