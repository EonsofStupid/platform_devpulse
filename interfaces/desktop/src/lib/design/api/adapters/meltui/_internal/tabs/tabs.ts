/**
 * @file MeltUI Tabs Adapter Barrel
 * @description Exports types and factory. No adapter-level contract — contracts live in taxonomy.
 */

export type { MeltTabsElement, MeltTabsState } from "./types.js";

export {
	MELT_ELEMENTS,
	ELEMENT_TO_SLOT,
	MELT_STATES,
	STATE_TO_TOKEN,
} from "./types.js";

export {
	createMeltTabs,
	type MeltTabsInstance,
	type MeltTabsConfig,
} from "./factory.js";
