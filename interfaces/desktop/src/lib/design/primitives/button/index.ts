/**
 * @file primitives/button/index.ts
 * @kind button
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Button primitive barrel export.
 * Contract lives HERE — with the implementation (locked 2026-02-21).
 */

export { default as ButtonRoot } from "./Button.svelte";
export { contract } from "./contract.js";
export { buttonSlots, buttonStateTokens, buttonSlotStates } from "./types.js";
export type { ButtonRootProps, ButtonSlot, ButtonState, ButtonType } from "./types.js";
