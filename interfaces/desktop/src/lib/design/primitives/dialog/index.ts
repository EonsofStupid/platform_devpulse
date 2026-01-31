/**
 * @file Dialog Primitive Barrel
 */
export { default as Dialog } from "./Dialog.svelte";
export { default as DialogTrigger } from "./DialogTrigger.svelte";
export { default as DialogPortal } from "./DialogPortal.svelte";
export { default as DialogOverlay } from "./DialogOverlay.svelte";
export { default as DialogContent } from "./DialogContent.svelte";
export { default as DialogTitle } from "./DialogTitle.svelte";
export { default as DialogDescription } from "./DialogDescription.svelte";
export { default as DialogClose } from "./DialogClose.svelte";

export type {
	DialogProps,
	DialogTriggerProps,
	DialogPortalProps,
	DialogOverlayProps,
	DialogContentProps,
	DialogTitleProps,
	DialogDescriptionProps,
	DialogCloseProps,
} from "./types.js";

export { setDialogContext, getDialogContext, type DialogContext } from "./context.js";
