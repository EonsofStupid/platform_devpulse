import type { ColdLightDataAttrs } from "../../_internal/types/common.js";

export interface UseAlertDialogProps {
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	/** Called when the action button is clicked. */
	onAction?: () => void;
	/** Called when the cancel button is clicked. */
	onCancel?: () => void;
}

export interface AlertDialogTriggerAttrs extends ColdLightDataAttrs {
	"data-slot": "trigger";
	type: "button";
	"aria-haspopup": "dialog";
	"data-state": "open" | "closed";
	onclick: (e: MouseEvent) => void;
}

export interface AlertDialogOverlayAttrs extends ColdLightDataAttrs {
	"data-slot": "overlay";
	"aria-hidden": "true";
	popover: "manual";
	"data-state": "open" | "closed";
}

export interface AlertDialogContentAttrs extends ColdLightDataAttrs {
	"data-slot": "content";
	id: string;
	role: "alertdialog";
	"aria-modal": "true";
	"aria-labelledby": string;
	"aria-describedby": string;
	"data-state": "open" | "closed";
	onclose: (e: Event) => void;
	oncancel: (e: Event) => void;
}

export interface AlertDialogTitleAttrs extends ColdLightDataAttrs {
	"data-slot": "title";
	id: string;
}

export interface AlertDialogDescriptionAttrs extends ColdLightDataAttrs {
	"data-slot": "description";
	id: string;
}

export interface AlertDialogCancelAttrs extends ColdLightDataAttrs {
	"data-slot": "cancel";
	type: "button";
	onclick: (e: MouseEvent) => void;
}

export interface AlertDialogActionAttrs extends ColdLightDataAttrs {
	"data-slot": "action";
	type: "button";
	onclick: (e: MouseEvent) => void;
}

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
