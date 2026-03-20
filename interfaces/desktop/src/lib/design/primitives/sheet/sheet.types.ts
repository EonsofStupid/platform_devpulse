import type { ColdLightDataAttrs } from "../../_internal/types/common.js";

export type SheetSide = "top" | "right" | "bottom" | "left";

export interface UseSheetProps {
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	/** Which edge the sheet slides from. Default: "right". */
	side?: SheetSide;
	closeOnEscape?: boolean;
	closeOnOutsideClick?: boolean;
}

export interface SheetTriggerAttrs extends ColdLightDataAttrs {
	"data-slot": "trigger";
	type: "button";
	"aria-haspopup": "dialog";
	"aria-expanded": boolean;
	"data-state": "open" | "closed";
	onclick: (e: MouseEvent) => void;
}

export interface SheetOverlayAttrs extends ColdLightDataAttrs {
	"data-slot": "overlay";
	"aria-hidden": "true";
	popover: "manual";
	"data-state": "open" | "closed";
}

export interface SheetContentAttrs extends ColdLightDataAttrs {
	"data-slot": "content";
	id: string;
	role: "dialog";
	"aria-modal": "true";
	"aria-labelledby": string;
	"aria-describedby": string;
	"data-state": "open" | "closed";
	"data-side": SheetSide;
	onclose: (e: Event) => void;
	oncancel: (e: Event) => void;
}

export interface SheetTitleAttrs extends ColdLightDataAttrs {
	"data-slot": "title";
	id: string;
}

export interface SheetDescriptionAttrs extends ColdLightDataAttrs {
	"data-slot": "description";
	id: string;
}

export interface SheetCloseAttrs extends ColdLightDataAttrs {
	"data-slot": "close";
	type: "button";
	onclick: (e: MouseEvent) => void;
}

export interface UseSheetReturn {
	readonly open: boolean;
	setOpen(value: boolean): void;
	readonly trigger: SheetTriggerAttrs;
	readonly overlay: SheetOverlayAttrs;
	readonly content: SheetContentAttrs;
	readonly title: SheetTitleAttrs;
	readonly description: SheetDescriptionAttrs;
	readonly close: SheetCloseAttrs;
	attachContent: (node: HTMLDialogElement) => { destroy(): void };
	attachOverlay: (node: HTMLElement) => { destroy(): void };
	attachTrigger: (node: HTMLElement) => { destroy(): void };
}
