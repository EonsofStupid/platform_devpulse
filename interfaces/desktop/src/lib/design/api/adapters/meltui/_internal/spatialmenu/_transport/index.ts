/**
 * @file api/adapters/meltui/_internal/spatialmenu/_transport/index.ts
 * @package @devpulse/coldlight
 */

export { createSpatialMenuTransport } from "./factory.js";
export type {
	SpatialMenuTransport,
	SpatialMenuTransportConfig,
	SpatialMenuTransportItem,
	SpatialMenuTransportStates,
} from "./types.js";
