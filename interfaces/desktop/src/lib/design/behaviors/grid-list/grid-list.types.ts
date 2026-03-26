import type { HTMLAttributes } from "svelte/elements";

export interface UseGridListProps {
	selectedKeys?: Set<string>;
	onSelectionChange?: (keys: Set<string>) => void;
	multiple?: boolean;
	disabled?: boolean;
	"aria-label"?: string;
}

export type GridListRootAttrs = HTMLAttributes<HTMLDivElement> & {
	"data-kind": "grid-list";
	"data-slot": "root";
};

export type GridListItemAttrs = HTMLAttributes<HTMLDivElement> & {
	"data-kind": "grid-list";
	"data-slot": "item";
	"data-key": string;
	"data-selected"?: "";
	"data-disabled"?: "";
};

export interface UseGridListReturn {
	readonly root: GridListRootAttrs;
	getItem(key: string, options?: { disabled?: boolean }): GridListItemAttrs;
}
