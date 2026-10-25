/**
 * @file primitives/pin-input/index.ts
 * @kind pin-input
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Pin-input primitive barrel export.
 * Contract lives HERE — with the implementation (locked 2026-02-21).
 */

export { contract } from "./contract.js";
export { pinInputSlots, pinInputStateTokens, pinInputSlotStates } from "./types.js";
export type {
	PinInputRootProps,
	PinInputFieldProps,
	PinInputSlot,
	PinInputState,
} from "./types.js";
