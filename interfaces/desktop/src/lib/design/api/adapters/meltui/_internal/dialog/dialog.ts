/**
 * @file MeltUI Dialog
 * @description Consolidates exports from types, contract, and factory for the barrel.
 */

// =============================================================================
// TYPES
// =============================================================================

export type { MeltDialogElement, MeltDialogState } from "./types";

export {
  MELT_ELEMENTS,
  ELEMENT_TO_SLOT,
  MELT_STATES,
  STATE_TO_TOKEN,
} from "./types";

// =============================================================================
// CONTRACT
// =============================================================================

export {
  MELT_BUILDER,
  ADAPTER_ID,
  KIND,
  MELT_HANDLES,
  COLDLIGHT_ADDS,
  SLOTS,
} from "./contract";

// =============================================================================
// FACTORY
// =============================================================================

export {
  createMeltDialog,
  type MeltDialogInstance,
  type MeltDialogConfig,
} from "./factory";
