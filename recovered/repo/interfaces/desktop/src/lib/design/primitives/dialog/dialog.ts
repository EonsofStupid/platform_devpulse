/**
 * @file Dialog Primitive
 * @description Consolidates exports from context, types, and contract for the barrel.
 */

// =============================================================================
// CONTEXT
// =============================================================================

export type { DialogContext } from "./context.js";
export { setDialogContext, getDialogContext } from "./context.js";

// =============================================================================
// TYPES
// =============================================================================

export type {
  DialogProps,
  DialogSlotProps,
  DialogSlot,
  DialogState,
} from "./types.js";

// =============================================================================
// CONTRACT
// =============================================================================

export {
  contract as dialogContract,
  dialogSlots,
  dialogStateTokens,
  dialogSlotStates,
} from "./contract.js";
