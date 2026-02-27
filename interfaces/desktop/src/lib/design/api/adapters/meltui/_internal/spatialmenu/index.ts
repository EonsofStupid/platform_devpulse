/**
 * @file api/adapters/meltui/_internal/spatialmenu/index.ts
 * @package @devpulse/coldlight
 *
 * MeltUI spatial-menu _internal barrel.
 * This is the ONLY allowed import path from outside this folder.
 * Components import createSpatialMenuTransport from here — NEVER from melt directly.
 */

export { createSpatialMenuTransport } from "./_transport/index.js";
export type {
	SpatialMenuTransport,
	SpatialMenuTransportConfig,
	SpatialMenuTransportItem,
	SpatialMenuTransportStates,
} from "./_transport/index.js";
export {
	createMeltSpatialMenu,
	type MeltSpatialMenuConfig,
	type MeltSpatialMenuInstance,
} from "./factory.js";
