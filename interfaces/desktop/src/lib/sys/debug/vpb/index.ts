/**
 * @file sys/debug/vpb/index.ts
 * @description VPB (Visual Page Builder) barrel export
 */

// Main component
export { default as VPB } from "./VPB.svelte";

// State store
export { vpb } from "./state/vpb.svelte";

// Types
export type {
  VPBTab,
  VPBSelection,
  VPBClipboard,
  VPBDragState,
  VPBHistoryEntry,
  VPBState,
  VPBAction,
  InspectorField,
  InspectorSection,
} from "./types/vpb";

// Stub exports for compatibility (TODO: implement)
export const dnd = {};
export const scan = {};

// Re-export common types
export type { VPBMode, DropEffect, ElementInfo } from "./types/dnd";
