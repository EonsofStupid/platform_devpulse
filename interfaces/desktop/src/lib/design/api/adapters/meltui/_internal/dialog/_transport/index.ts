/**
 * @file api/adapters/meltui/_internal/dialog/_transport/index.ts
 * @package @devpulse/coldlight
 */

export { createDialogTransport } from "./factory.js";
export type {
	DialogTransport,
	DialogTransportConfig,
	DialogTransportRefs,
	DialogTransportStates,
} from "./types.js";
