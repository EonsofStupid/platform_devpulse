/**
 * @file ColdLight Dialog Contract
 * @description Links ColdLight dialog to the taxonomy SSOT.
 *
 * This file re-exports the taxonomy contract and adds ColdLight-specific
 * constants like data attribute names.
 */

// =============================================================================
// TAXONOMY CONTRACT RE-EXPORTS
// =============================================================================

export {
  contract,
  dialogSlots,
  dialogStates,
  dialogSlotStates,
  type DialogSlot,
  type DialogState,
} from "$lib/design/taxonomy/primitives/dialog";

// =============================================================================
// COLDLIGHT CONSTANTS
// =============================================================================

/** Adapter identifier */
export const ADAPTER_ID = "coldlight" as const;

/** Primitive kind (matches folder name) */
export const KIND = "dialog" as const;

/**
 * Data attributes applied by ColdLight to all primitive elements.
 * These enable CSS targeting: [data-kind="dialog"][data-slot="content"]
 */
export const DATA_ATTRS = {
  /** Primitive kind: data-kind="dialog" */
  kind: "data-kind",

  /** Slot name: data-slot="content" */
  slot: "data-slot",

  /** State tokens (space-separated): data-state="open focus-visible" */
  state: "data-state",
} as const;
