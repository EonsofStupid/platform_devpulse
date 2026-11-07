/**
 * @file Button Primitive
 * @description Consolidates exports from types and contract for the barrel.
 */

// =============================================================================
// TYPES
// =============================================================================

export type {
  ButtonProps,
  ButtonVariant,
  ButtonSize,
  ButtonSlot,
  ButtonState,
} from "./types.js";

// =============================================================================
// CONTRACT
// =============================================================================

export {
  contract as buttonContract,
  buttonSlots,
  buttonStateTokens,
  buttonSlotStates,
} from "./contract.js";
