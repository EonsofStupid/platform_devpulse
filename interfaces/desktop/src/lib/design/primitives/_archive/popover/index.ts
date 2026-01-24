/**
 * @file primitives/popover/index.ts
 * @layer primitives
 *
 * Popover primitive namespace export.
 * Non-modal floating content positioned relative to trigger.
 *
 * Usage:
 * ```svelte
 * import { Popover } from "$lib/design/primitives";
 *
 * <Popover.Root bind:open>
 *   <Popover.Trigger>Open</Popover.Trigger>
 *   <Popover.Portal>
 *     <Popover.Content>
 *       <p>Popover content</p>
 *       <Popover.Arrow />
 *       <Popover.Close>×</Popover.Close>
 *     </Popover.Content>
 *   </Popover.Portal>
 * </Popover.Root>
 * ```
 */

// Components
export { default as Root } from "./Root.svelte";
export { default as Trigger } from "./Trigger.svelte";
export { default as Portal } from "./Portal.svelte";
export { default as Overlay } from "./Overlay.svelte";
export { default as Content } from "./Content.svelte";
export { default as Close } from "./Close.svelte";
export { default as Arrow } from "./Arrow.svelte";

// Types
export type {
  PopoverRootProps,
  PopoverTriggerProps,
  PopoverPortalProps,
  PopoverOverlayProps,
  PopoverContentProps,
  PopoverCloseProps,
  PopoverArrowProps,
  PopoverState,
  PopoverSlot,
  PopoverSide,
  PopoverAlign,
} from "./types.js";

export { PopoverSlots } from "./types.js";
