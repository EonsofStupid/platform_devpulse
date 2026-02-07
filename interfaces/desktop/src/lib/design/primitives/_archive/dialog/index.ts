/**
 * @file primitives/dialog/index.ts
 * @layer primitives
 *
 * Dialog primitive namespace export.
 *
 * Usage:
 * ```svelte
 * import { Dialog } from "$lib/design/primitives";
 *
 * <Dialog.Root bind:open>
 *   <Dialog.Trigger>Open</Dialog.Trigger>
 *   <Dialog.Portal>
 *     <Dialog.Overlay />
 *     <Dialog.Content>
 *       <Dialog.Title>Title</Dialog.Title>
 *       <Dialog.Description>Description</Dialog.Description>
 *       <Dialog.Close>×</Dialog.Close>
 *     </Dialog.Content>
 *   </Dialog.Portal>
 * </Dialog.Root>
 * ```
 */

export { default as Close } from "./Close.svelte";
export { default as Content } from "./Content.svelte";
export { default as Description } from "./Description.svelte";
export { default as Overlay } from "./Overlay.svelte";
export { default as Portal } from "./Portal.svelte";
// Components
export { default as Root } from "./Root.svelte";
export { default as Title } from "./Title.svelte";
export { default as Trigger } from "./Trigger.svelte";

// Types
export type {
	DialogCloseProps,
	DialogContentProps,
	DialogDescriptionProps,
	DialogOverlayProps,
	DialogPortalProps,
	DialogRootProps,
	DialogSlot,
	DialogState,
	DialogTitleProps,
	DialogTriggerProps,
} from "./types.js";

export { DialogSlots } from "./types.js";
