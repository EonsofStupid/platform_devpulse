import type { ColdLightDataAttrs } from "../../_internal/types/common.js";

export interface UseLabelProps {
	/** The ID of the form control this label is associated with. */
	htmlFor?: string;
	/** Whether the associated control is disabled. */
	disabled?: boolean;
}

export interface LabelRootAttrs extends ColdLightDataAttrs {
	"data-slot": "root";
	id: string;
	for: string | undefined;
	"data-disabled": "" | undefined;
}

export interface UseLabelReturn {
	readonly root: LabelRootAttrs;
}
