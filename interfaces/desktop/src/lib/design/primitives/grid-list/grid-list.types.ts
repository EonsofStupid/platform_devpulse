import type { ColdLightDataAttrs } from "../../_internal/types/common.js";

export interface UseGridListProps {
	selectedKeys?: Set<string>;
	onSelectionChange?: (keys: Set<string>) => void;
	multiple?: boolean;
	disabled?: boolean;
	"aria-label"?: string;
}

export interface GridListRootAttrs extends ColdLightDataAttrs {
	"data-slot": "root";
	id: string;
	role: "grid";
	"aria-label": string | undefined;
	"aria-multiselectable": boolean | undefined;
	"aria-disabled": string | undefined;
	onkeydown: (e: KeyboardEvent) => void;
}

export interface GridListItemAttrs extends ColdLightDataAttrs {
	"data-slot": "item";
	role: "row";
	tabindex: 0;
	"aria-selected": boolean;
	"aria-disabled": boolean | undefined;
	"data-key": string;
	"data-selected": "" | undefined;
	"data-disabled": "" | undefined;
	onclick: (e: MouseEvent) => void;
}

export interface UseGridListReturn {
	readonly root: GridListRootAttrs;
	getItem(key: string, options?: { disabled?: boolean }): GridListItemAttrs;
}
