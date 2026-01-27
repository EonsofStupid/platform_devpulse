/**
 * @file MeltUI Dialog
 * @description Main dialog implementation file for MeltUI adapter.
 *
 * Consolidates exports from types and contract for the barrel.
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
