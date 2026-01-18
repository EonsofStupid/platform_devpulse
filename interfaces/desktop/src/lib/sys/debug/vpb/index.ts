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
