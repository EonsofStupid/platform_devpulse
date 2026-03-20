import type { HTMLAttributes, HTMLButtonAttributes, HTMLDialogAttributes } from "svelte/elements";

export type SheetSide = "top" | "right" | "bottom" | "left";

export interface UseSheetProps {
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	side?: SheetSide;
	closeOnEscape?: boolean;
	closeOnOutsideClick?: boolean;
}

export type SheetTriggerAttrs = HTMLButtonAttributes & {
	"data-kind": "sheet";
	"data-slot": "trigger";
	"data-state": "open" | "closed";
};

export type SheetOverlayAttrs = HTMLAttributes<HTMLDivElement> & {
	"data-kind": "sheet";
	"data-slot": "overlay";
	"data-state": "open" | "closed";
};

export type SheetContentAttrs = HTMLDialogAttributes & {
	"data-kind": "sheet";
	"data-slot": "content";
	"data-state": "open" | "closed";
	"data-side": SheetSide;
};

export type SheetTitleAttrs = HTMLAttributes<HTMLHeadingElement> & {
	"data-kind": "sheet";
	"data-slot": "title";
};

export type SheetDescriptionAttrs = HTMLAttributes<HTMLParagraphElement> & {
	"data-kind": "sheet";
	"data-slot": "description";
};

export type SheetCloseAttrs = HTMLButtonAttributes & {
	"data-kind": "sheet";
	"data-slot": "close";
};

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
