/**
 * @file VPB Taxonomy Exports
 * @description Visual Page Builder block types and validation
 */

// Block kinds
export {
  blockKinds,
  blockKindKeys,
  getKindDefinition,
  getKindSlots,
  shellKinds,
  surfaceKinds,
  widgetKinds,
  chatKinds,
  type BlockKind,
  type BlockKindDefinition,
} from "./kinds";

// Block contracts (Zod schemas)
export {
  kindContracts,
  getKindSchema,
  getDefaultProps,
  type KindContract,
  type KindProps,
} from "./contracts";

// Slot constraints
export { isChildAllowed, getAllowedChildren } from "./slots";
