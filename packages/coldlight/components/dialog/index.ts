export { default as Root } from "./Dialog.svelte";
export { default as Close } from "./DialogClose.svelte";
export { default as Content } from "./DialogContent.svelte";
export { default as Description } from "./DialogDescription.svelte";
export { default as Footer } from "./DialogFooter.svelte";
export { default as Header } from "./DialogHeader.svelte";
export { default as Overlay } from "./DialogOverlay.svelte";
export { default as Title } from "./DialogTitle.svelte";
export { default as Trigger } from "./DialogTrigger.svelte";
export { DIALOG_DEFAULTS, DIALOG_VARIANTS } from "./dialog.generated.js";
export type {
	DialogCloseProps,
	DialogContentProps,
	DialogDescriptionProps,
	DialogFooterProps,
	DialogHeaderProps,
	DialogIds,
	DialogOpenChangeDetails,
	DialogOverlayProps,
	DialogRootProps,
	DialogSize,
	DialogTitleProps,
	DialogTriggerProps,
	DialogVariant,
} from "./types.js";
