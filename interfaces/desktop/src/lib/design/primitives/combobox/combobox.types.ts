import type { HTMLAttributes, HTMLButtonAttributes, HTMLInputAttributes, HTMLLabelAttributes } from "svelte/elements";

export interface UseComboBoxProps {
	inputValue?: string;
	onInputChange?: (value: string) => void;
	selectedValue?: string;
	onSelectedChange?: (value: string) => void;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	disabled?: boolean;
	placeholder?: string;
	"aria-label"?: string;
	"aria-labelledby"?: string;
}

export type ComboboxRootAttrs = HTMLAttributes<HTMLDivElement> & {
	"data-kind": "combobox";
	"data-slot": "root";
};

export type ComboboxInputAttrs = HTMLInputAttributes & {
	"data-kind": "combobox";
	"data-slot": "input";
	"data-state": "open" | "closed";
};

export type ComboboxTriggerAttrs = HTMLButtonAttributes & {
	"data-kind": "combobox";
	"data-slot": "trigger";
	"data-state": "open" | "closed";
};

export type ComboboxListboxAttrs = HTMLAttributes<HTMLDivElement> & {
	"data-kind": "combobox";
	"data-slot": "listbox";
};

export type ComboboxLabelAttrs = HTMLLabelAttributes & {
	"data-kind": "combobox";
	"data-slot": "label";
};

export type ComboboxOptionAttrs = HTMLAttributes<HTMLDivElement> & {
	"data-kind": "combobox";
	"data-slot": "option";
	"data-value": string;
	"data-state": "selected" | "unselected";
	"data-highlighted"?: "";
	"data-disabled"?: "";
};

export interface UseComboBoxReturn {
	readonly inputValue: string;
	readonly selectedValue: string;
	readonly open: boolean;
	readonly highlightedId: string | null;
	setOpen(value: boolean): void;
	readonly root: ComboboxRootAttrs;
	readonly input: ComboboxInputAttrs;
	readonly trigger: ComboboxTriggerAttrs;
	readonly listbox: ComboboxListboxAttrs;
	readonly label: ComboboxLabelAttrs;
	getOption(optionValue: string, options?: { disabled?: boolean }): ComboboxOptionAttrs;
	attachListbox: (node: HTMLElement) => { destroy(): void };
}
