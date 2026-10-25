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

export { default as Arrow } from "./Arrow.svelte";
export { default as Close } from "./Close.svelte";
export { default as Content } from "./Content.svelte";
export { default as Overlay } from "./Overlay.svelte";
export { default as Portal } from "./Portal.svelte";
// Components
export { default as Root } from "./Root.svelte";
export { default as Trigger } from "./Trigger.svelte";

// Types
export type {
	PopoverAlign,
	PopoverArrowProps,
	PopoverCloseProps,
	PopoverContentProps,
	PopoverOverlayProps,
	PopoverPortalProps,
	PopoverRootProps,
	PopoverSide,
	PopoverSlot,
	PopoverState,
	PopoverTriggerProps,
} from "./types.js";

export { PopoverSlots } from "./types.js";
