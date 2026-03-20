import type { ColdLightDataAttrs } from "../../_internal/types/common.js";

export type TextFieldType = "text" | "email" | "password" | "url" | "tel";

export interface UseTextFieldProps {
	/** Current value. */
	value?: string;
	/** Callback on value change. */
	onValueChange?: (value: string) => void;
	/** Input type. Default: "text". */
	type?: TextFieldType;
	/** Placeholder text. */
	placeholder?: string;
	disabled?: boolean;
	readonly?: boolean;
	required?: boolean;
	invalid?: boolean;
	/** Error message (links to error slot via aria-describedby when invalid). */
	error?: string;
	"aria-label"?: string;
	"aria-labelledby"?: string;
	"aria-describedby"?: string;
	"aria-errormessage"?: string;
}

export interface TextFieldRootAttrs extends ColdLightDataAttrs {
	"data-slot": "root";
	id: string;
	"data-disabled": "" | undefined;
	"data-invalid": "" | undefined;
}

export interface TextFieldInputAttrs extends ColdLightDataAttrs {
	"data-slot": "input";
	id: string;
	type: TextFieldType;
	value: string;
	placeholder: string | undefined;
	disabled: boolean | undefined;
	readonly: boolean | undefined;
	required: boolean | undefined;
	"aria-invalid": boolean | undefined;
	"aria-required": boolean | undefined;
	"aria-disabled": boolean | undefined;
	"aria-readonly": boolean | undefined;
	"aria-label": string | undefined;
	"aria-labelledby": string;
	"aria-describedby": string | undefined;
	"aria-errormessage": string | undefined;
	"data-disabled": "" | undefined;
	"data-readonly": "" | undefined;
	"data-invalid": "" | undefined;
	oninput: (e: Event) => void;
}

export interface TextFieldLabelAttrs extends ColdLightDataAttrs {
	"data-slot": "label";
	id: string;
	for: string;
	"data-disabled": "" | undefined;
}

export interface TextFieldDescriptionAttrs extends ColdLightDataAttrs {
	"data-slot": "description";
	id: string;
}

export interface TextFieldErrorAttrs extends ColdLightDataAttrs {
	"data-slot": "error";
	id: string;
	role: "alert";
	"aria-live": "polite";
	"data-invalid": "" | undefined;
}

export interface UseTextFieldReturn {
	readonly value: string;
	readonly root: TextFieldRootAttrs;
	readonly input: TextFieldInputAttrs;
	readonly label: TextFieldLabelAttrs;
	readonly description: TextFieldDescriptionAttrs;
	readonly error: TextFieldErrorAttrs;
	focus(): void;
	clear(): void;
}
