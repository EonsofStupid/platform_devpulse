/**
 * @file primitives/separator/index.ts
 * @kind separator
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Separator primitive barrel export.
 * Contract lives HERE — with the implementation.
 */

export { default as Separator } from "./Separator.svelte";
export { contract } from "./contract.js";
export { separatorSlots, separatorStateTokens, separatorSlotStates } from "./types.js";
export type { SeparatorProps, SeparatorSlot, SeparatorState } from "./types.js";
