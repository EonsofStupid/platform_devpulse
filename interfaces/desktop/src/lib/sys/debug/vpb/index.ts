/**
 * @fileoverview index.ts
 * @file src/lib/sys/debug/vpb/index.ts
 * @module @devpulse/sys/debug/vpb/index
 * @layer lib
 *
 * @description
 * [TODO: Describe the purpose and responsibility of this module]
 *
 * @dependencies
 * - [TODO: List imports this file depends on]
 *
 * @consumers
 * - [TODO: List modules that import this file]
 *
 * @vpb-editable [TODO: List props VPB can modify, or 'none']
 * @since 1.0.0
 */

/**
 * VPB (Visual Page Builder) Entry
 * Dev-only tool for design system validation and component inspection.
 */

// State management
export { vpb, type VPBMode } from './state/vpb.svelte';
export { dnd, type DropEffect } from './state/dnd.svelte';
export { scan, type ElementInfo } from './state/scan.svelte';

// Main component
export { default as VPB } from './VPB.svelte';

// Sub-components (for advanced usage)
export { default as VPBPanel } from './components/VPBPanel.svelte';
export { default as VPBToolbar } from './components/VPBToolbar.svelte';
export { default as VPBTabs } from './components/VPBTabs.svelte';
export { default as VPBIcon } from './components/VPBIcon.svelte';
export { default as VPBToast } from './components/VPBToast.svelte';
export { default as VPBInspector } from './components/VPBInspector.svelte';

// Scan components
export { default as ScanOverlay } from './scan/ScanOverlay.svelte';
export { default as ScanTooltip } from './scan/ScanTooltip.svelte';
export { parseElement, formatForAI } from './scan/element-parser';
