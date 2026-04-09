import type { HTMLLabelAttributes } from "svelte/elements";

export interface UseLabelProps {
	htmlFor?: string;
	disabled?: boolean;
}

export type LabelRootAttrs = HTMLLabelAttributes & {
	"data-kind": "label";
	"data-slot": "root";
	"data-disabled"?: "";
};

export interface UseLabelReturn {
	readonly root: LabelRootAttrs;
}
