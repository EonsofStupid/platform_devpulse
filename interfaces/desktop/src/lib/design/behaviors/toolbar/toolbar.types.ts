import type { HTMLAttributes } from "svelte/elements";
import type { Orientation } from "../_internal/utils/kbd.js";

export interface UseToolbarProps {
	label?: string;
	orientation?: Orientation;
	disabled?: boolean;
	loop?: boolean;
}

export type ToolbarRootAttrs = HTMLAttributes<HTMLDivElement> & {
	"data-kind": "toolbar";
	"data-slot": "root";
	"data-orientation": Orientation;
	"data-disabled"?: "";
};

export type ToolbarItemAttrs = HTMLAttributes<HTMLDivElement> & {
	"data-kind": "toolbar";
	"data-slot": "item";
	"data-value": string;
	"data-disabled"?: "";
};

export interface UseToolbarReturn {
	readonly root: ToolbarRootAttrs;
	getItem(value: string, options?: { disabled?: boolean; active?: boolean }): ToolbarItemAttrs;
}
