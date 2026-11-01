/**
 * @file primitives/file-upload/index.ts
 * @kind file-upload
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * File-upload primitive barrel export.
 * Contract lives HERE — with the implementation (locked 2026-02-21).
 */

export { contract } from "./contract.js";
export { fileUploadSlots, fileUploadStateTokens, fileUploadSlotStates } from "./types.js";
export type {
	FileUploadRootProps,
	FileUploadTriggerProps,
	FileUploadSlot,
	FileUploadState,
} from "./types.js";
