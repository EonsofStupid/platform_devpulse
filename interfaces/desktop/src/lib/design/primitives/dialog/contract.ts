/**
 * @file Dialog Primitive Contract
 * @description Re-exports contract from ColdLight public API surface.
 *
 * This links the Svelte primitive back to the taxonomy contract
 * via ColdLight, ensuring no MeltUI leakage.
 */

export {
  contract,
  dialogSlots,
  dialogStateTokens,
  dialogSlotStates,
} from "$lib/design/api/adapters/coldlight/dialog";
