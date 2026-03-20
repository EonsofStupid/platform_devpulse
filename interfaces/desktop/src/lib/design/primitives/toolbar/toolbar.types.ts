import type { ColdLightDataAttrs } from "../../_internal/types/common.js";
import type { Orientation } from "../../_internal/utils/kbd.js";

export interface UseToolbarProps {
	/** Accessible label for the toolbar. */
	label?: string;
	/** Orientation. Default: "horizontal". */
	orientation?: Orientation;
	/** Whether all items are disabled. */
	disabled?: boolean;
	/** Loop from last to first. Default: true. */
	loop?: boolean;
}

export interface ToolbarRootAttrs extends ColdLightDataAttrs {
	"data-slot": "root";
	id: string;
	role: "toolbar";
	"aria-orientation": Orientation;
	"aria-label": string | undefined;
	"data-orientation": Orientation;
	"data-disabled": "" | undefined;
}

export interface ToolbarItemAttrs extends ColdLightDataAttrs {
	"data-slot": "item";
	tabindex: 0 | -1;
	"data-value": string;
	"data-disabled": "" | undefined;
	"aria-disabled": boolean | undefined;
	onkeydown: (e: KeyboardEvent) => void;
}

export interface UseToolbarReturn {
	readonly root: ToolbarRootAttrs;
	/** Get item attrs. Items use roving tabindex. */
	getItem(
		value: string,
		options?: { disabled?: boolean; active?: boolean },
	): ToolbarItemAttrs;
}
