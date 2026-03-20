import type { ColdLightDataAttrs } from "../../_internal/types/common.js";

export interface UseTreeProps {
	expandedKeys?: Set<string>;
	onExpandedChange?: (keys: Set<string>) => void;
	selectedKeys?: Set<string>;
	onSelectionChange?: (keys: Set<string>) => void;
	disabled?: boolean;
	"aria-label"?: string;
}

export interface TreeRootAttrs extends ColdLightDataAttrs {
	"data-slot": "root";
	id: string;
	role: "tree";
	"aria-label": string | undefined;
	"aria-disabled": boolean | undefined;
	onkeydown: (e: KeyboardEvent) => void;
}

export interface TreeItemAttrs extends ColdLightDataAttrs {
	"data-slot": "item";
	role: "treeitem";
	tabindex: 0;
	"aria-expanded": boolean | undefined;
	"aria-selected": boolean;
	"aria-level": number;
	"aria-disabled": boolean | undefined;
	"data-key": string;
	"data-has-children": "" | undefined;
	"data-expanded": "" | undefined;
	"data-selected": "" | undefined;
	"data-disabled": "" | undefined;
	onclick: (e: MouseEvent) => void;
}

export interface TreeGroupAttrs extends ColdLightDataAttrs {
	"data-slot": "group";
	role: "group";
}

export interface UseTreeReturn {
	readonly root: TreeRootAttrs;
	getItem(
		key: string,
		options?: { hasChildren?: boolean; level?: number; disabled?: boolean },
	): TreeItemAttrs;
	getGroup(): TreeGroupAttrs;
	toggleExpanded(key: string): void;
}
