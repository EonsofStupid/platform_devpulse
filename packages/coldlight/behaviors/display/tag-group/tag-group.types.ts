import type { HTMLAttributes, HTMLButtonAttributes } from "svelte/elements";

export interface UseTagGroupProps {
	values?: string[];
	onRemove?: (value: string) => void;
	disabled?: boolean;
	"aria-label"?: string;
}

export type TagGroupRootAttrs = HTMLAttributes<HTMLDivElement> & {
	"data-kind": "tag-group";
	"data-slot": "root";
	"data-disabled"?: "";
};

export type TagGroupLabelAttrs = HTMLAttributes<HTMLSpanElement> & {
	"data-kind": "tag-group";
	"data-slot": "label";
};

export type TagGroupDescriptionAttrs = HTMLAttributes<HTMLSpanElement> & {
	"data-kind": "tag-group";
	"data-slot": "description";
};

export type TagGroupTagAttrs = HTMLAttributes<HTMLDivElement> & {
	"data-kind": "tag-group";
	"data-slot": "tag";
	"data-value": string;
	"data-disabled"?: "";
};

export type TagGroupRemoveAttrs = HTMLButtonAttributes & {
	"data-kind": "tag-group";
	"data-slot": "remove";
	"data-disabled"?: "";
};

export interface UseTagGroupReturn {
	readonly root: TagGroupRootAttrs;
	readonly label: TagGroupLabelAttrs;
	readonly description: TagGroupDescriptionAttrs;
	getTag(value: string, options?: { disabled?: boolean }): TagGroupTagAttrs;
	getRemove(value: string, options?: { disabled?: boolean }): TagGroupRemoveAttrs;
}
