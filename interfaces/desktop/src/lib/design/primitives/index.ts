/**
 * @file src/lib/design/primitives/index.ts
 * @layer primitives
 *
 * @description
 * Barrel export for Bits UI primitive wrappers.
 * All primitives are pure behavior components with NO styling.
 * Styling comes from recipe classes applied by components/renderers.
 *
 * @since 1.0.0
 */

// Bits UI Primitive Wrappers
export { default as Accordion } from "./Accordion.svelte";
export { default as Button } from "./Button.svelte";
export { default as Dialog } from "./Dialog.svelte";
export { default as Popover } from "./Popover.svelte";
export { default as Select } from "./Select.svelte";
export { default as Tabs } from "./Tabs.svelte";
export { default as Toggle } from "./Toggle.svelte";

// Re-export Bits UI sub-components for direct use in components/renderers
export {
  Accordion as BitsAccordion,
  Dialog as BitsDialog,
  Popover as BitsPopover,
  Select as BitsSelect,
  Tabs as BitsTabs,
} from "bits-ui";
