/**
 * @file ColdLight Dialog
 * @description Consolidates exports from types, contract, and adapter for the barrel.
 */

// =============================================================================
// TYPES
// =============================================================================

export type {
  DialogSlot,
  DialogState,
  DialogProps,
  DialogSlotProps,
} from "./types";

// =============================================================================
// CONTRACT
// =============================================================================

export {
  contract,
  dialogSlots,
  dialogStateTokens,
  dialogSlotStates,
  ADAPTER_ID,
  KIND,
  DATA_ATTRS,
} from "./contract";

// =============================================================================
// ADAPTER (runtime factory)
// =============================================================================

export {
  createDialogBuilder,
  type DialogBuilderInstance,
  type DialogBuilderConfig,
} from "./adapter";
