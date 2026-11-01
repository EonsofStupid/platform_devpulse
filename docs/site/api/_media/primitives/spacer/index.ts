/**
 * @file primitives/spacer/index.ts
 * @kind spacer
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Spacer primitive barrel export.
 * Contract lives HERE — with the implementation.
 */

export { default as Spacer } from "./Spacer.svelte";
export { contract } from "./contract.js";
export { spacerSlots, spacerStateTokens, spacerSlotStates } from "./types.js";
export type { SpacerProps, SpacerSlot, SpacerState } from "./types.js";
