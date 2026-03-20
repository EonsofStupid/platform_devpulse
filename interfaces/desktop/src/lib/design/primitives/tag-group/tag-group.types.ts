import type { ColdLightDataAttrs } from "../../_internal/types/common.js";

export interface UseTagGroupProps {
	/** Current tag values. */
	values?: string[];
	/** Callback when a tag is removed. */
	onRemove?: (value: string) => void;
	disabled?: boolean;
	"aria-label"?: string;
}

export interface TagGroupRootAttrs extends ColdLightDataAttrs {
	"data-slot": "root";
	id: string;
	role: "grid";
	"aria-label": string | undefined;
	"data-disabled": "" | undefined;
}

export interface TagGroupLabelAttrs extends ColdLightDataAttrs {
	"data-slot": "label";
}

export interface TagGroupDescriptionAttrs extends ColdLightDataAttrs {
	"data-slot": "description";
}

export interface TagGroupTagAttrs extends ColdLightDataAttrs {
	"data-slot": "tag";
	role: "row";
	tabindex: 0;
	"data-value": string;
	"data-disabled": "" | undefined;
	onkeydown: (e: KeyboardEvent) => void;
}

export interface TagGroupRemoveAttrs extends ColdLightDataAttrs {
	"data-slot": "remove";
	type: "button";
	tabindex: -1;
	"aria-label": string;
	"aria-disabled": boolean | undefined;
	"data-disabled": "" | undefined;
	onclick: (e: MouseEvent) => void;
}

export interface UseTagGroupReturn {
	readonly root: TagGroupRootAttrs;
	readonly label: TagGroupLabelAttrs;
	readonly description: TagGroupDescriptionAttrs;
	getTag(value: string, options?: { disabled?: boolean }): TagGroupTagAttrs;
	getRemove(value: string, options?: { disabled?: boolean }): TagGroupRemoveAttrs;
}
