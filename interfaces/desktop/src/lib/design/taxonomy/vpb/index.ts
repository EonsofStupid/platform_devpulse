/**
 * @file VPB Taxonomy Exports
 * @description Visual Page Builder block types and validation
 */

// Block contracts (Zod schemas)
export {
	getDefaultProps,
	getKindSchema,
	type KindContract,
	type KindProps,
	kindContracts,
} from "./contracts";
// Block kinds
export {
	type BlockKind,
	type BlockKindDefinition,
	blockKindKeys,
	blockKinds,
	chatKinds,
	getKindDefinition,
	getKindSlots,
	shellKinds,
	surfaceKinds,
	widgetKinds,
} from "./kinds";

// Slot constraints
export { getAllowedChildren, isChildAllowed } from "./slots";
