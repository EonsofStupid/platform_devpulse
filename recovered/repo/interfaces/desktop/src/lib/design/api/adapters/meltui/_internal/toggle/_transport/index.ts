/**
 * @file api/adapters/meltui/_internal/toggle/_transport/index.ts
 * @package @devpulse/coldlight
 */

export { createToggleTransport } from "./factory.js";
export type {
	ToggleTransport,
	ToggleTransportConfig,
	ToggleTransportStates,
} from "./types.js";
