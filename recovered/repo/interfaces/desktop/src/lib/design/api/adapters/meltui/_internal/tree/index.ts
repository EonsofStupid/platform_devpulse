/**
 * @file api/adapters/meltui/_internal/tree/index.ts
 * @package @devpulse/coldlight
 *
 * MeltUI tree _internal barrel.
 * This is the ONLY allowed import path from outside this folder.
 * Components import createTreeTransport from here — NEVER from melt directly.
 */

export { createTreeTransport } from "./_transport/index.js";
export type {
	ColdLightTreeItem,
	TreeTransport,
	TreeTransportConfig,
	TreeTransportStates,
	TreeChildTransport,
} from "./_transport/index.js";
export { createMeltTree, type TreeItem, type MeltTreeConfig, type MeltTreeInstance } from "./factory.js";
