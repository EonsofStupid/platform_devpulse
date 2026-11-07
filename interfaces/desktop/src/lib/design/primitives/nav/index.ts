/**
 * @file primitives/nav/index.ts
 * @kind nav
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Nav primitive barrel export.
 * Contract lives HERE — with the implementation.
 */

export { default as NavRoot } from "./Nav.svelte";
export { contract } from "./contract.js";
export { navSlots, navStateTokens, navSlotStates } from "./types.js";
export type { NavProps, NavSlot, NavState } from "./types.js";
