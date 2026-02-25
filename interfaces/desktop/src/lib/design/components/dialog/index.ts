/**
 * @file Dialog Component Barrel
 * @kind dialog
 * @layer components
 *
 * Compound component: exports root + all sub-components.
 */

export { default as Dialog } from "./Dialog.svelte";
export { default as DialogTrigger } from "./DialogTrigger.svelte";
export { default as DialogOverlay } from "./DialogOverlay.svelte";
export { default as DialogContent } from "./DialogContent.svelte";
export { default as DialogHeader } from "./DialogHeader.svelte";
export { default as DialogFooter } from "./DialogFooter.svelte";
export { default as DialogTitle } from "./DialogTitle.svelte";
export { default as DialogDescription } from "./DialogDescription.svelte";
export { default as DialogClose } from "./DialogClose.svelte";

export { contract as dialogComponentContract } from "./contract.js";
export { setDialogContext, getDialogContext } from "./context.js";

export type {
	DialogProps,
	DialogTriggerProps,
	DialogContentProps,
	DialogOverlayProps,
	DialogHeaderProps,
	DialogFooterProps,
	DialogTitleProps,
	DialogDescriptionProps,
	DialogCloseProps,
} from "./types.js";
