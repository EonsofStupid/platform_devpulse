import type { ColdLightDataAttrs } from "../../_internal/types/common.js";

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

export interface SelectRootAttrs extends ColdLightDataAttrs {
	"data-slot": "root";
}

export interface SelectTriggerAttrs extends ColdLightDataAttrs {
	"data-slot": "trigger";
	id: string;
	role: "combobox";
	type: "button";
	tabindex: 0;
	"aria-expanded": boolean;
	"aria-haspopup": "listbox";
	"aria-activedescendant": string | undefined;
	"aria-controls": string;
	"aria-disabled": string | undefined;
	"aria-required": boolean | undefined;
	"aria-label": string | undefined;
	"aria-labelledby": string | undefined;
	"data-state": "open" | "closed";
	"data-disabled": "" | undefined;
	"data-placeholder": "" | undefined;
	onclick: (e: MouseEvent) => void;
	onkeydown: (e: KeyboardEvent) => void;
}

export interface SelectValueAttrs extends ColdLightDataAttrs {
	"data-slot": "value";
}

export interface SelectListboxAttrs extends ColdLightDataAttrs {
	"data-slot": "listbox";
	id: string;
	role: "listbox";
}

export interface SelectLabelAttrs extends ColdLightDataAttrs {
	"data-slot": "label";
}

export interface SelectOptionAttrs extends ColdLightDataAttrs {
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
	getOption(
		optionValue: string,
		options?: { disabled?: boolean; label?: string },
	): SelectOptionAttrs;
	attachListbox: (node: HTMLElement) => { destroy(): void };
}
