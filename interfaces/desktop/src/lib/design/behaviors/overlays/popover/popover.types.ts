import type { HTMLAttributes, HTMLButtonAttributes } from "svelte/elements";

export interface UsePopoverProps {
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	closeOnEscape?: boolean;
	closeOnOutsideClick?: boolean;
	modal?: boolean;
	/** Accessible name for the panel — role=dialog MUST be named. */
	"aria-label"?: string;
	/** Id of the element that labels the panel (wins over aria-label). */
	"aria-labelledby"?: string;
}

export type PopoverTriggerAttrs = HTMLButtonAttributes & {
	"data-kind": "popover";
	"data-slot": "trigger";
	"data-state": "open" | "closed";
};

export type PopoverContentAttrs = HTMLAttributes<HTMLDivElement> & {
	"data-kind": "popover";
	"data-slot": "content";
	"data-state": "open" | "closed";
};

export type PopoverArrowAttrs = HTMLAttributes<HTMLDivElement> & {
	"data-kind": "popover";
	"data-slot": "arrow";
};

export type PopoverCloseAttrs = HTMLButtonAttributes & {
	"data-kind": "popover";
	"data-slot": "close";
};

export interface UsePopoverReturn {
	readonly open: boolean;
	setOpen(value: boolean): void;
	readonly trigger: PopoverTriggerAttrs;
	readonly content: PopoverContentAttrs;
	readonly arrow: PopoverArrowAttrs;
	readonly close: PopoverCloseAttrs;
	attachContent: (node: HTMLElement) => { destroy(): void };
}
