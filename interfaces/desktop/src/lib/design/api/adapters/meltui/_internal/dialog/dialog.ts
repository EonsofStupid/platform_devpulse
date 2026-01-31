/**
 * @file MeltUI Dialog Adapter Barrel
 * @description Exports types and factory. No adapter-level contract — contracts live in taxonomy.
 */

export type { MeltDialogElement, MeltDialogState } from "./types.js";

export {
	MELT_ELEMENTS,
	ELEMENT_TO_SLOT,
	MELT_STATES,
	STATE_TO_TOKEN,
} from "./types.js";

export {
	createMeltDialog,
	type MeltDialogInstance,
	type MeltDialogConfig,
} from "./factory.js";
