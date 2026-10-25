/**
 * @file api/adapters/meltui/_internal/tabs/index.ts
 * @package @devpulse/coldlight
 *
 * MeltUI tabs _internal barrel.
 * This is the ONLY allowed import path from outside this folder.
 * Components import createTabsTransport from here — NEVER from melt directly.
 */

export { createTabsTransport } from "./_transport/index.js";
export type {
	TabsTransport,
	TabsTransportConfig,
	TabsTransportStates,
} from "./_transport/index.js";
export { createMeltTabs, type MeltTabsConfig, type MeltTabsInstance } from "./factory.js";
