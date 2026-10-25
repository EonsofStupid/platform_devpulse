/**
 * @file taxonomy/button/index.ts
 * @package @devpulse/coldlight
 *
 * Button taxonomy barrel.
 * Contract + primitive + types — all in one place.
 */

export { default as Button } from "./Button.svelte";
export { contract } from "./contract.js";
export { buttonSlots, buttonStateTokens, buttonSlotStates } from "./types.js";
export type { ButtonSlot, ButtonState, ButtonType, ButtonProps } from "./types.js";
