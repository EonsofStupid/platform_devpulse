import type { HTMLAttributes } from "svelte/elements";

export interface UseTreeProps {
	expandedKeys?: Set<string>;
	onExpandedChange?: (keys: Set<string>) => void;
	selectedKeys?: Set<string>;
	onSelectionChange?: (keys: Set<string>) => void;
	disabled?: boolean;
	"aria-label"?: string;
}

export type TreeRootAttrs = HTMLAttributes<HTMLDivElement> & {
	"data-kind": "tree";
	"data-slot": "root";
};

export type TreeItemAttrs = HTMLAttributes<HTMLDivElement> & {
	"data-kind": "tree";
	"data-slot": "item";
	"data-key": string;
	"data-has-children"?: "";
	"data-expanded"?: "";
	"data-selected"?: "";
	"data-disabled"?: "";
};

export type TreeGroupAttrs = HTMLAttributes<HTMLDivElement> & {
	"data-kind": "tree";
	"data-slot": "group";
};

export interface UseTreeReturn {
	readonly root: TreeRootAttrs;
	getItem(
		key: string,
		options?: { hasChildren?: boolean; level?: number; disabled?: boolean },
	): TreeItemAttrs;
	getGroup(): TreeGroupAttrs;
	toggleExpanded(key: string): void;
}
