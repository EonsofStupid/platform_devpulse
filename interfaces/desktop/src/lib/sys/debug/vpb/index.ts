/**
 * @file sys/debug/vpb/index.ts
 * @description VPB (Visual Page Builder) barrel export
 */

// State store
export { vpb } from "./state/vpb.svelte";
// Types
export type {
	InspectorField,
	InspectorSection,
	VPBAction,
	VPBClipboard,
	VPBDragState,
	VPBHistoryEntry,
	VPBSelection,
	VPBState,
	VPBTab,
} from "./types/vpb";
// Main component
export { default as VPB } from "./VPB.svelte";

// Stub exports for compatibility (TODO: implement)
export const dnd = {};
export const scan = {};

// Re-export common types
export type { DropEffect, ElementInfo, VPBMode } from "./types/dnd";
