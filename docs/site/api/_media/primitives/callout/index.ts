/**
 * @file primitives/callout/index.ts
 * @kind callout
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Callout primitive barrel export.
 * Contract lives HERE — with the implementation.
 */

export { default as CalloutRoot } from "./Callout.svelte";
export { contract } from "./contract.js";
export { calloutSlots, calloutStateTokens, calloutSlotStates } from "./types.js";
export type { CalloutProps, CalloutSlot, CalloutState } from "./types.js";
