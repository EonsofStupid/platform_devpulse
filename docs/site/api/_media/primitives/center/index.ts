/**
 * @file primitives/center/index.ts
 * @kind center
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Center primitive barrel export.
 * Contract lives HERE — with the implementation.
 */

export { default as Center } from "./Center.svelte";
export { contract } from "./contract.js";
export { centerSlots, centerStateTokens, centerSlotStates } from "./types.js";
export type { CenterProps, CenterSlot, CenterState } from "./types.js";
