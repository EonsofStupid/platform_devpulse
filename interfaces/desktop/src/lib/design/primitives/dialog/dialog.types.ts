import type { HTMLAttributes, HTMLButtonAttributes, HTMLDialogAttributes } from "svelte/elements";

export interface UseDialogProps {
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	closeOnEscape?: boolean;
	closeOnOutsideClick?: boolean;
	preventScroll?: boolean;
}

export type DialogTriggerAttrs = HTMLButtonAttributes & {
	"data-kind": "dialog";
	"data-slot": "trigger";
	"data-state": "open" | "closed";
};

export type DialogOverlayAttrs = HTMLAttributes<HTMLDivElement> & {
	"data-kind": "dialog";
	"data-slot": "overlay";
	"data-state": "open" | "closed";
};

export type DialogContentAttrs = HTMLDialogAttributes & {
	"data-kind": "dialog";
	"data-slot": "content";
	"data-state": "open" | "closed";
};

export type DialogTitleAttrs = HTMLAttributes<HTMLHeadingElement> & {
	"data-kind": "dialog";
	"data-slot": "title";
};

export type DialogDescriptionAttrs = HTMLAttributes<HTMLParagraphElement> & {
	"data-kind": "dialog";
	"data-slot": "description";
};

export type DialogCloseAttrs = HTMLButtonAttributes & {
	"data-kind": "dialog";
	"data-slot": "close";
};

export interface UseDialogReturn {
	readonly open: boolean;
	setOpen(value: boolean): void;
	readonly trigger: DialogTriggerAttrs;
	readonly overlay: DialogOverlayAttrs;
	readonly content: DialogContentAttrs;
	readonly title: DialogTitleAttrs;
	readonly description: DialogDescriptionAttrs;
	readonly close: DialogCloseAttrs;
	attachContent: (node: HTMLDialogElement) => { destroy(): void };
	attachOverlay: (node: HTMLElement) => { destroy(): void };
	attachTrigger: (node: HTMLElement) => { destroy(): void };
}
