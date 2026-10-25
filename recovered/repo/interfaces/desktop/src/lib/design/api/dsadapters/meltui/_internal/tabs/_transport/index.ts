/**
 * @file api/adapters/meltui/_internal/tabs/_transport/index.ts
 * @package @devpulse/coldlight
 */

export { createTabsTransport } from "./factory.js";
export type {
	TabsTransport,
	TabsTransportConfig,
	TabsTransportStates,
} from "./types.js";
