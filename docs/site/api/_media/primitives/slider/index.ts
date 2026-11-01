/**
 * @file primitives/slider/index.ts
 * @kind slider
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Slider primitive barrel export.
 * Contract lives HERE — with the implementation (locked 2026-02-21).
 */

export { contract } from "./contract.js";
export { sliderSlots, sliderStateTokens, sliderSlotStates } from "./types.js";
export type {
	SliderRootProps,
	SliderThumbProps,
	SliderRangeProps,
	SliderSlot,
	SliderState,
} from "./types.js";
