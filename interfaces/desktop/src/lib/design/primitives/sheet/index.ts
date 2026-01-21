/**
 * @file primitives/sheet/index.ts
 * @layer primitives
 *
 * Sheet primitive namespace export.
 * Sheet is a Dialog variant that slides in from a side.
 *
 * Usage:
 * ```svelte
 * import { Sheet } from "$lib/design/primitives";
 *
 * <Sheet.Root bind:open>
 *   <Sheet.Trigger>Open</Sheet.Trigger>
 *   <Sheet.Portal>
 *     <Sheet.Overlay />
 *     <Sheet.Content side="right">
 *       <Sheet.Title>Title</Sheet.Title>
 *       <Sheet.Description>Description</Sheet.Description>
 *       <Sheet.Close>×</Sheet.Close>
 *     </Sheet.Content>
 *   </Sheet.Portal>
 * </Sheet.Root>
 * ```
 */

// Components
export { default as Root } from "./Root.svelte";
export { default as Trigger } from "./Trigger.svelte";
export { default as Portal } from "./Portal.svelte";
export { default as Overlay } from "./Overlay.svelte";
export { default as Content } from "./Content.svelte";
export { default as Title } from "./Title.svelte";
export { default as Description } from "./Description.svelte";
export { default as Close } from "./Close.svelte";

// Types
export type {
  SheetRootProps,
  SheetTriggerProps,
  SheetPortalProps,
  SheetOverlayProps,
  SheetContentProps,
  SheetTitleProps,
  SheetDescriptionProps,
  SheetCloseProps,
  SheetState,
  SheetSlot,
  SheetSide,
} from "./types.js";

export { SheetSlots } from "./types.js";
