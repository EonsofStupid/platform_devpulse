import type { HTMLAttributes, HTMLButtonAttributes, HTMLLabelAttributes } from "svelte/elements";

export interface UseSelectProps {
	value?: string;
	onValueChange?: (value: string) => void;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	disabled?: boolean;
	required?: boolean;
	placeholder?: string;
	"aria-label"?: string;
	"aria-labelledby"?: string;
}

export type SelectRootAttrs = HTMLAttributes<HTMLDivElement> & {
	"data-kind": "select";
	"data-slot": "root";
};

export type SelectTriggerAttrs = HTMLButtonAttributes & {
	"data-kind": "select";
	"data-slot": "trigger";
	"data-state": "open" | "closed";
	"data-disabled"?: "";
	"data-placeholder"?: "";
};

export type SelectValueAttrs = HTMLAttributes<HTMLSpanElement> & {
	"data-kind": "select";
	"data-slot": "value";
};

export type SelectListboxAttrs = HTMLAttributes<HTMLDivElement> & {
	"data-kind": "select";
	"data-slot": "listbox";
};

export type SelectLabelAttrs = HTMLLabelAttributes & {
	"data-kind": "select";
	"data-slot": "label";
};

export type SelectOptionAttrs = HTMLAttributes<HTMLDivElement> & {
	"data-kind": "select";
	"data-slot": "option";
	"data-value": string;
	"data-state": "selected" | "unselected";
	"data-highlighted"?: "";
	"data-disabled"?: "";
};

export interface UseSelectReturn {
	readonly value: string;
	readonly open: boolean;
	readonly highlightedId: string | null;
	setOpen(value: boolean): void;
	readonly root: SelectRootAttrs;
	readonly trigger: SelectTriggerAttrs;
	readonly valueDisplay: SelectValueAttrs;
	readonly listbox: SelectListboxAttrs;
	readonly label: SelectLabelAttrs;
	getOption(optionValue: string, options?: { disabled?: boolean; label?: string }): SelectOptionAttrs;
	attachListbox: (node: HTMLElement) => { destroy(): void };
}
