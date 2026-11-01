/**
 * @file primitives/divider/index.ts
 * @kind divider
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Divider primitive barrel export.
 * Contract lives HERE — with the implementation.
 */

export { default as Divider } from "./Divider.svelte";
export { contract } from "./contract.js";
export { dividerSlots, dividerStateTokens, dividerSlotStates } from "./types.js";
export type { DividerProps, DividerSlot, DividerState } from "./types.js";
