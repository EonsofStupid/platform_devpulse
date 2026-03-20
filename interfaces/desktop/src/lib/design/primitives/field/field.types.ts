import type { ColdLightDataAttrs } from "../../_internal/types/common.js";

export interface UseFieldProps {
	/** Whether the field value is invalid. */
	invalid?: boolean;
	/** Whether the field is required. */
	required?: boolean;
	/** Whether the field is disabled. */
	disabled?: boolean;
	/** Error message text (used to determine if error slot should be linked). */
	error?: string;
}

export interface FieldRootAttrs extends ColdLightDataAttrs {
	"data-slot": "root";
	id: string;
	role: "group";
	"aria-labelledby": string;
	"data-invalid": "" | undefined;
	"data-required": "" | undefined;
	"data-disabled": "" | undefined;
}

export interface FieldLabelAttrs extends ColdLightDataAttrs {
	"data-slot": "label";
	id: string;
	for: string;
	"data-required": "" | undefined;
	"data-disabled": "" | undefined;
}

export interface FieldControlAttrs extends ColdLightDataAttrs {
	"data-slot": "control";
	id: string;
	"aria-describedby": string | undefined;
	"aria-invalid": string | undefined;
	"aria-required": string | undefined;
	"aria-disabled": string | undefined;
	"data-invalid": "" | undefined;
	"data-required": "" | undefined;
	"data-disabled": "" | undefined;
}

export interface FieldDescriptionAttrs extends ColdLightDataAttrs {
	"data-slot": "description";
	id: string;
}

export interface FieldErrorAttrs extends ColdLightDataAttrs {
	"data-slot": "error";
	id: string;
	role: "alert";
	"aria-live": "polite";
	"data-invalid": "" | undefined;
}

export interface UseFieldReturn {
	readonly root: FieldRootAttrs;
	readonly label: FieldLabelAttrs;
	readonly control: FieldControlAttrs;
	readonly description: FieldDescriptionAttrs;
	readonly error: FieldErrorAttrs;
	/** The generated control ID — use this for htmlFor on standalone labels. */
	readonly controlId: string;
}
