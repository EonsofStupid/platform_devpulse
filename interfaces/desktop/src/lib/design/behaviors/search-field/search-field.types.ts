import type { HTMLAttributes, HTMLButtonAttributes, HTMLInputAttributes } from "svelte/elements";

export interface UseSearchFieldProps {
	value?: string;
	onValueChange?: (value: string) => void;
	onClear?: () => void;
	placeholder?: string;
	disabled?: boolean;
	"aria-label"?: string;
	"aria-describedby"?: string;
}

export type SearchFieldRootAttrs = HTMLAttributes<HTMLDivElement> & {
	"data-kind": "search-field";
	"data-slot": "root";
	"data-disabled"?: "";
	"data-has-value"?: "";
};

export type SearchFieldInputAttrs = HTMLInputAttributes & {
	"data-kind": "search-field";
	"data-slot": "input";
	"data-disabled"?: "";
};

export type SearchFieldIconAttrs = HTMLAttributes<HTMLSpanElement> & {
	"data-kind": "search-field";
	"data-slot": "icon";
};

export type SearchFieldClearAttrs = HTMLButtonAttributes & {
	"data-kind": "search-field";
	"data-slot": "clear";
	"data-disabled"?: "";
	"data-visible"?: "";
};

export interface UseSearchFieldReturn {
	readonly value: string;
	readonly hasValue: boolean;
	readonly root: SearchFieldRootAttrs;
	readonly input: SearchFieldInputAttrs;
	readonly icon: SearchFieldIconAttrs;
	readonly clear: SearchFieldClearAttrs;
	clearValue(): void;
}
