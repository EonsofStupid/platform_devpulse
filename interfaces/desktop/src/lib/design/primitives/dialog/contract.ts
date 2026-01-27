/**
 * @file Dialog Primitive Contract
 * @description Re-exports contract from taxonomy SSOT.
 *
 * This links the Svelte primitive back to the taxonomy contract,
 * ensuring alignment between implementation and specification.
 */

export {
  contract,
  dialogSlots,
  dialogStates,
  dialogSlotStates,
} from "$lib/design/taxonomy/primitives/dialog";
