/**
 * @file ColdLight Dialog
 * @description Main dialog implementation file.
 *
 * This is the named file for the dialog primitive in ColdLight.
 * It consolidates exports from types and contract for the barrel.
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
  dialogStates,
  dialogSlotStates,
  ADAPTER_ID,
  KIND,
  DATA_ATTRS,
} from "./contract";
