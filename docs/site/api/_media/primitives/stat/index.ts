/**
 * @file primitives/stat/index.ts
 * @kind stat
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Stat primitive barrel export.
 * Contract lives HERE — with the implementation.
 */

export { default as Stat } from "./Stat.svelte";
export { contract } from "./contract.js";
export { statSlots, statStateTokens, statSlotStates } from "./types.js";
export type { StatProps, StatSlot, StatState } from "./types.js";
