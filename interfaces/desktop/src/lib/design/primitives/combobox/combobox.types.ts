import type { ColdLightDataAttrs } from "../../_internal/types/common.js";

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

export interface ComboboxRootAttrs extends ColdLightDataAttrs {
	"data-slot": "root";
}

export interface ComboboxInputAttrs extends ColdLightDataAttrs {
	"data-slot": "input";
	id: string;
	role: "combobox";
	type: "text";
	value: string;
	placeholder: string | undefined;
	"aria-expanded": boolean;
	"aria-haspopup": "listbox";
	"aria-activedescendant": string | undefined;
	"aria-autocomplete": "list";
	"aria-controls": string;
	"aria-disabled": string | undefined;
	"aria-label": string | undefined;
	"aria-labelledby": string | undefined;
	"data-state": "open" | "closed";
	disabled: boolean | undefined;
	oninput: (e: Event) => void;
	onkeydown: (e: KeyboardEvent) => void;
	onfocus: (e: FocusEvent) => void;
}

export interface ComboboxTriggerAttrs extends ColdLightDataAttrs {
	"data-slot": "trigger";
	type: "button";
	tabindex: -1;
	"aria-label": string;
	"data-state": "open" | "closed";
	onclick: (e: MouseEvent) => void;
}

export interface ComboboxListboxAttrs extends ColdLightDataAttrs {
	"data-slot": "listbox";
	id: string;
	role: "listbox";
}

export interface ComboboxLabelAttrs extends ColdLightDataAttrs {
	"data-slot": "label";
}

export interface ComboboxOptionAttrs extends ColdLightDataAttrs {
	"data-slot": "option";
	id: string;
	role: "option";
	"aria-selected": boolean;
	"aria-disabled": boolean | undefined;
	"data-value": string;
	"data-state": "selected" | "unselected";
	"data-highlighted": "" | undefined;
	"data-disabled": "" | undefined;
	onclick: (e: MouseEvent) => void;
	onpointerenter: (e: PointerEvent) => void;
}

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
