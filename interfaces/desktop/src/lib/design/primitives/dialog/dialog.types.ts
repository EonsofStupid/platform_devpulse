import type { ColdLightDataAttrs } from "../../_internal/types/common.js";

export interface UseDialogProps {
	/** Whether the dialog is open. Default: false. */
	open?: boolean;
	/** Callback when open state changes. */
	onOpenChange?: (open: boolean) => void;
	/** Close on Escape key. Default: true. */
	closeOnEscape?: boolean;
	/** Close on click outside content. Default: true. */
	closeOnOutsideClick?: boolean;
	/** Prevent body scroll when open. Default: true. */
	preventScroll?: boolean;
}

export interface DialogTriggerAttrs extends ColdLightDataAttrs {
	"data-slot": "trigger";
	type: "button";
	"aria-haspopup": "dialog";
	"aria-expanded": boolean;
	"aria-controls": string;
	"data-state": "open" | "closed";
	onclick: (e: MouseEvent) => void;
}

export interface DialogOverlayAttrs extends ColdLightDataAttrs {
	"data-slot": "overlay";
	"aria-hidden": "true";
	popover: "manual";
	"data-state": "open" | "closed";
}

export interface DialogContentAttrs extends ColdLightDataAttrs {
	"data-slot": "content";
	id: string;
	role: "dialog";
	"aria-modal": "true";
	"aria-labelledby": string;
	"aria-describedby": string;
	"data-state": "open" | "closed";
	onclose: (e: Event) => void;
	oncancel: (e: Event) => void;
}

export interface DialogTitleAttrs extends ColdLightDataAttrs {
	"data-slot": "title";
	id: string;
}

export interface DialogDescriptionAttrs extends ColdLightDataAttrs {
	"data-slot": "description";
	id: string;
}

export interface DialogCloseAttrs extends ColdLightDataAttrs {
	"data-slot": "close";
	type: "button";
	onclick: (e: MouseEvent) => void;
}

export interface UseDialogReturn {
	/** Current open state. */
	readonly open: boolean;
	/** Set open state programmatically. */
	setOpen(value: boolean): void;
	/** Spread onto the trigger button. */
	readonly trigger: DialogTriggerAttrs;
	/** Spread onto the overlay element. */
	readonly overlay: DialogOverlayAttrs;
	/** Spread onto the content element (native <dialog>). */
	readonly content: DialogContentAttrs;
	/** Spread onto the title element. */
	readonly title: DialogTitleAttrs;
	/** Spread onto the description element. */
	readonly description: DialogDescriptionAttrs;
	/** Spread onto the close button. */
	readonly close: DialogCloseAttrs;
	/** Svelte action: attach to content <dialog> element. */
	attachContent: (node: HTMLDialogElement) => { destroy(): void };
	/** Svelte action: attach to overlay element. */
	attachOverlay: (node: HTMLElement) => { destroy(): void };
	/** Svelte action: attach to trigger element. */
	attachTrigger: (node: HTMLElement) => { destroy(): void };
}
