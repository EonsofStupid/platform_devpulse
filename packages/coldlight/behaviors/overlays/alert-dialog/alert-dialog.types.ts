import type { HTMLAttributes, HTMLButtonAttributes, HTMLDialogAttributes } from "svelte/elements";

export interface UseAlertDialogProps {
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	onAction?: () => void;
	onCancel?: () => void;
}

export type AlertDialogTriggerAttrs = HTMLButtonAttributes & {
	"data-kind": "alert-dialog";
	"data-slot": "trigger";
	"data-state": "open" | "closed";
};

export type AlertDialogOverlayAttrs = HTMLAttributes<HTMLDivElement> & {
	"data-kind": "alert-dialog";
	"data-slot": "overlay";
	"data-state": "open" | "closed";
};

export type AlertDialogContentAttrs = HTMLDialogAttributes & {
	"data-kind": "alert-dialog";
	"data-slot": "content";
	"data-state": "open" | "closed";
};

export type AlertDialogTitleAttrs = HTMLAttributes<HTMLHeadingElement> & {
	"data-kind": "alert-dialog";
	"data-slot": "title";
};

export type AlertDialogDescriptionAttrs = HTMLAttributes<HTMLParagraphElement> & {
	"data-kind": "alert-dialog";
	"data-slot": "description";
};

export type AlertDialogCancelAttrs = HTMLButtonAttributes & {
	"data-kind": "alert-dialog";
	"data-slot": "cancel";
};

export type AlertDialogActionAttrs = HTMLButtonAttributes & {
	"data-kind": "alert-dialog";
	"data-slot": "action";
};

export interface UseAlertDialogReturn {
	readonly open: boolean;
	setOpen(value: boolean): void;
	readonly trigger: AlertDialogTriggerAttrs;
	readonly overlay: AlertDialogOverlayAttrs;
	readonly content: AlertDialogContentAttrs;
	readonly title: AlertDialogTitleAttrs;
	readonly description: AlertDialogDescriptionAttrs;
	readonly cancel: AlertDialogCancelAttrs;
	readonly action: AlertDialogActionAttrs;
	attachContent: (node: HTMLDialogElement) => { destroy(): void };
	attachOverlay: (node: HTMLElement) => { destroy(): void };
}
