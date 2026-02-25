/**
 * @file primitives/progress/index.ts
 * @kind progress
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Progress primitive barrel export.
 * Contract lives HERE — with the implementation (locked 2026-02-21).
 */

export { contract } from "./contract.js";
export { progressSlots, progressStateTokens, progressSlotStates } from "./types.js";
export type {
	ProgressRootProps,
	ProgressIndicatorProps,
	ProgressSlot,
	ProgressState,
} from "./types.js";
