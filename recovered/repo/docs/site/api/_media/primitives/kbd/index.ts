/**
 * @file primitives/kbd/index.ts
 * @kind kbd
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Kbd primitive barrel export.
 */

export { default as Kbd } from "./Kbd.svelte";
export { contract } from "./contract.js";
export { kbdSlots, kbdStateTokens, kbdSlotStates } from "./types.js";
export type { KbdProps, KbdSlot, KbdState } from "./types.js";
