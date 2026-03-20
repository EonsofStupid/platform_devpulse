import type { ColdLightDataAttrs } from "../../_internal/types/common.js";

export interface UseSearchFieldProps {
	value?: string;
	onValueChange?: (value: string) => void;
	onClear?: () => void;
	placeholder?: string;
	disabled?: boolean;
	"aria-label"?: string;
	"aria-describedby"?: string;
}

export interface SearchFieldRootAttrs extends ColdLightDataAttrs {
	"data-slot": "root";
	id: string;
	role: "search";
	"aria-label": string;
	"data-disabled": "" | undefined;
	"data-has-value": "" | undefined;
}

export interface SearchFieldInputAttrs extends ColdLightDataAttrs {
	"data-slot": "input";
	id: string;
	role: "searchbox";
	type: "search";
	value: string;
	placeholder: string;
	disabled: boolean | undefined;
	"aria-label": string;
	"aria-describedby": string | undefined;
	"aria-disabled": string;
	"data-disabled": "" | undefined;
	oninput: (e: Event) => void;
	onkeydown: (e: KeyboardEvent) => void;
}

export interface SearchFieldIconAttrs extends ColdLightDataAttrs {
	"data-slot": "icon";
	id: string;
	"aria-hidden": "true";
}

export interface SearchFieldClearAttrs extends ColdLightDataAttrs {
	"data-slot": "clear";
	id: string;
	type: "button";
	tabindex: 0 | -1;
	"aria-label": string;
	"aria-disabled": string;
	"data-disabled": "" | undefined;
	"data-visible": "" | undefined;
	onclick: (e: MouseEvent) => void;
}

export interface UseSearchFieldReturn {
	readonly value: string;
	readonly hasValue: boolean;
	readonly root: SearchFieldRootAttrs;
	readonly input: SearchFieldInputAttrs;
	readonly icon: SearchFieldIconAttrs;
	readonly clear: SearchFieldClearAttrs;
	clearValue(): void;
}
