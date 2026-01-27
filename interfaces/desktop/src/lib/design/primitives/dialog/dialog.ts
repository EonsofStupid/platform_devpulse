/**
 * @file Dialog Primitive
 * @description Main dialog implementation file.
 *
 * Consolidates exports from context, types, and contract for the barrel.
 */

// =============================================================================
// CONTEXT
// =============================================================================

export type { DialogContext } from "./context";
export { setDialogContext, getDialogContext } from "./context";

// =============================================================================
// TYPES
// =============================================================================

export type {
  DialogProps,
  DialogSlotProps,
  DialogSlot,
  DialogState,
} from "./types";

// =============================================================================
// CONTRACT
// =============================================================================

export {
  contract,
  dialogSlots,
  dialogStates,
  dialogSlotStates,
} from "./contract";
