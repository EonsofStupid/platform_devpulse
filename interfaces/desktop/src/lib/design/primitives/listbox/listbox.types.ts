import type { HTMLAttributes } from "svelte/elements";

export interface UseListBoxProps {
	value?: string | string[];
	onValueChange?: (value: string | string[]) => void;
	multiple?: boolean;
	disabled?: boolean;
	"aria-label"?: string;
	"aria-labelledby"?: string;
}

export type ListboxRootAttrs = HTMLAttributes<HTMLDivElement> & {
	"data-kind": "listbox";
	"data-slot": "root";
	"data-disabled"?: "";
};

export type ListboxOptionAttrs = HTMLAttributes<HTMLDivElement> & {
	"data-kind": "listbox";
	"data-slot": "option";
	"data-value": string;
	"data-state": "selected" | "unselected";
	"data-highlighted"?: "";
	"data-disabled"?: "";
};

export type ListboxGroupAttrs = HTMLAttributes<HTMLDivElement> & {
	"data-kind": "listbox";
	"data-slot": "group";
};

export interface UseListBoxReturn {
	readonly value: string | string[];
	readonly highlightedId: string | null;
	readonly root: ListboxRootAttrs;
	getOption(optionValue: string, options?: { disabled?: boolean; label?: string }): ListboxOptionAttrs;
	getGroup(label: string): ListboxGroupAttrs;
}
