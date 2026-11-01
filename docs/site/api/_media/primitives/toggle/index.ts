/**
 * @file primitives/toggle/index.ts
 * @kind toggle
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Toggle primitive barrel export.
 * Contract lives HERE — with the implementation (locked 2026-02-21).
 */

export { contract } from "./contract.js";
export { toggleSlots, toggleStateTokens, toggleSlotStates } from "./types.js";
export type { ToggleTriggerProps, ToggleSlot, ToggleState } from "./types.js";
