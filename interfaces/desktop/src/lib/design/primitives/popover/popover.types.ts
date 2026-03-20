import type { ColdLightDataAttrs } from "../../_internal/types/common.js";

export interface UsePopoverProps {
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	closeOnEscape?: boolean;
	closeOnOutsideClick?: boolean;
	modal?: boolean;
}

export interface PopoverTriggerAttrs extends ColdLightDataAttrs {
	"data-slot": "trigger";
	type: "button";
	"aria-expanded": boolean;
	"aria-haspopup": "dialog";
	"aria-controls": string;
	"data-state": "open" | "closed";
	onclick: (e: MouseEvent) => void;
}

export interface PopoverContentAttrs extends ColdLightDataAttrs {
	"data-slot": "content";
	id: string;
	role: "dialog";
	"data-state": "open" | "closed";
}

export interface PopoverArrowAttrs extends ColdLightDataAttrs {
	"data-slot": "arrow";
	"aria-hidden": "true";
}

export interface PopoverCloseAttrs extends ColdLightDataAttrs {
	"data-slot": "close";
	type: "button";
	onclick: (e: MouseEvent) => void;
}

export interface UsePopoverReturn {
	readonly open: boolean;
	setOpen(value: boolean): void;
	readonly trigger: PopoverTriggerAttrs;
	readonly content: PopoverContentAttrs;
	readonly arrow: PopoverArrowAttrs;
	readonly close: PopoverCloseAttrs;
	attachContent: (node: HTMLElement) => { destroy(): void };
}
