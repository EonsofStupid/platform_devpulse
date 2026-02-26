/**
 * @file primitives/input-group/index.ts
 * @kind input-group
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Input-group primitive barrel export.
 * Contract lives HERE — with the implementation.
 */

export { default as InputGroup } from "./InputGroup.svelte";
export { contract } from "./contract.js";
export { inputGroupSlots, inputGroupStateTokens, inputGroupSlotStates } from "./types.js";
export type { InputGroupProps, InputGroupSlot, InputGroupState } from "./types.js";
