/**
 * @fileoverview index.ts
 * @file src/lib/design/primitives/index.ts
 * @module @devpulse/design/primitives/index
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

/* Design Primitives - Barrel Export */

export { default as Button } from './Button.svelte';
export { default as Accordion } from './Accordion.svelte';
export { default as Toggle } from './Toggle.svelte';
export { default as Tabs } from './Tabs.svelte';
export { default as TabSet } from './TabSet.svelte';
export { default as Dialog } from './Dialog.svelte';
export { default as Surface } from './Surface.svelte';
export { default as ParasiteLogo } from './ParasiteLogo.svelte';

// Re-export types
export type { AccordionItem } from './Accordion.svelte';
export type { TabItem } from './Tabs.svelte';

