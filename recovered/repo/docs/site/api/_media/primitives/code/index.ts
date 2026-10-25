/**
 * @file primitives/code/index.ts
 * @kind code
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Code primitive barrel export.
 * Contract lives HERE — with the implementation.
 */

export { default as Code } from "./Code.svelte";
export { contract } from "./contract.js";
export { codeSlots, codeStateTokens, codeSlotStates } from "./types.js";
export type { CodeProps, CodeSlot, CodeState } from "./types.js";
