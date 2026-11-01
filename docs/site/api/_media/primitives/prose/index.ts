/**
 * @file primitives/prose/index.ts
 * @kind prose
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Prose primitive barrel export.
 */

export { default as Prose } from "./Prose.svelte";
export { contract } from "./contract.js";
export { proseSlots, proseStateTokens, proseSlotStates } from "./types.js";
export type { ProseProps, ProseSlot, ProseState } from "./types.js";
