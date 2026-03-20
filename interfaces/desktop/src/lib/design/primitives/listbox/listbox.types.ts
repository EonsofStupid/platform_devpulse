import type { ColdLightDataAttrs } from "../../_internal/types/common.js";

export interface UseListBoxProps {
	/** Currently selected value(s). String for single, string[] for multiple. */
	value?: string | string[];
	onValueChange?: (value: string | string[]) => void;
	/** Allow multiple selection. Default: false. */
	multiple?: boolean;
	disabled?: boolean;
	"aria-label"?: string;
	"aria-labelledby"?: string;
}

export interface ListboxRootAttrs extends ColdLightDataAttrs {
	"data-slot": "root";
	id: string;
	role: "listbox";
	tabindex: 0;
	"aria-multiselectable": boolean | undefined;
	"aria-activedescendant": string | undefined;
	"aria-label": string | undefined;
	"aria-labelledby": string | undefined;
	"aria-disabled": string | undefined;
	"data-disabled": "" | undefined;
	onkeydown: (e: KeyboardEvent) => void;
}

export interface ListboxOptionAttrs extends ColdLightDataAttrs {
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

export interface ListboxGroupAttrs extends ColdLightDataAttrs {
	"data-slot": "group";
	role: "group";
	"aria-label": string;
}

export interface UseListBoxReturn {
	readonly value: string | string[];
	readonly highlightedId: string | null;
	readonly root: ListboxRootAttrs;
	getOption(
		optionValue: string,
		options?: { disabled?: boolean; label?: string },
	): ListboxOptionAttrs;
	getGroup(label: string): ListboxGroupAttrs;
}
