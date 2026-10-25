/**
 * @fileoverview index.ts
 * @file src/lib/sys/debug/vpb/scan/index.ts
 * @module @devpulse/sys/debug/vpb/scan/index
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
 * VPB Scan Module
 * Element scanning and inspection logic.
 */

export { default as ScanOverlay } from './ScanOverlay.svelte';
export { default as ScanTooltip } from './ScanTooltip.svelte';
export { parseElement, formatForAI, type ParsedElement } from './element-parser';
