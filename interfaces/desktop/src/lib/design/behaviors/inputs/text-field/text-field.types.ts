import type { HTMLAttributes, HTMLInputAttributes, HTMLLabelAttributes } from "svelte/elements";

export type TextFieldType = "text" | "email" | "password" | "url" | "tel";

export interface UseTextFieldProps {
	value?: string;
	onValueChange?: (value: string) => void;
	type?: TextFieldType;
	placeholder?: string;
	disabled?: boolean;
	readonly?: boolean;
	required?: boolean;
	invalid?: boolean;
	error?: string;
	"aria-label"?: string;
	"aria-labelledby"?: string;
	"aria-describedby"?: string;
	"aria-errormessage"?: string;
}

export type TextFieldRootAttrs = HTMLAttributes<HTMLDivElement> & {
	"data-kind": "text-field";
	"data-slot": "root";
	"data-disabled"?: "";
	"data-invalid"?: "";
};

export type TextFieldInputAttrs = HTMLInputAttributes & {
	"data-kind": "text-field";
	"data-slot": "input";
	"data-disabled"?: "";
	"data-readonly"?: "";
	"data-invalid"?: "";
};

export type TextFieldLabelAttrs = HTMLLabelAttributes & {
	"data-kind": "text-field";
	"data-slot": "label";
	"data-disabled"?: "";
};

export type TextFieldDescriptionAttrs = HTMLAttributes<HTMLDivElement> & {
	"data-kind": "text-field";
	"data-slot": "description";
};

export type TextFieldErrorAttrs = HTMLAttributes<HTMLDivElement> & {
	"data-kind": "text-field";
	"data-slot": "error";
	"data-invalid"?: "";
};

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
