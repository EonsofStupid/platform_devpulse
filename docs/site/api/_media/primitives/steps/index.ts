/**
 * @file primitives/steps/index.ts
 * @kind steps
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Steps primitive barrel export.
 * Contract lives HERE — with the implementation.
 */

export { default as StepsRoot } from "./Steps.svelte";
export { contract } from "./contract.js";
export { stepsSlots, stepsStateTokens, stepsSlotStates } from "./types.js";
export type { StepsProps, StepsSlot, StepsState } from "./types.js";
