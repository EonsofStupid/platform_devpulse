/**
 * @fileoverview index.ts
 * @file src/lib/sys/debug/vpb/components/index.ts
 * @module @devpulse/sys/debug/vpb/components/index
 * @layer lib
 *
 * @description
 * VPB Components.
 * UI components for the Visual Page Builder.
 *
 * @consumers
 * - sys/debug/vpb/index.ts
 *
 * @since 1.0.0
 */

export { default as Builder } from "./builder/Builder.svelte";
export { DraggableFrame, DropZone } from "./builder/dnd/index.js";
export * from "./builder/index.js";
export { default as Inspector } from "./inspector/Inspector.svelte";
export { default as ScanOverlay } from "./inspector/ScanOverlay.svelte";
export { default as ScanTooltip } from "./inspector/ScanTooltip.svelte";
export { default as VPBInspector } from "./inspector/VpbInspector.svelte";
export { default as VPBIcon } from "./VpbIcon.svelte";
export { default as VPBToolbar } from "./VpbToolbar.svelte";
