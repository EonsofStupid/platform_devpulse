import type { HTMLAttributes, HTMLInputAttributes, HTMLLabelAttributes } from "svelte/elements";

export interface UseFieldProps {
	invalid?: boolean;
	required?: boolean;
	disabled?: boolean;
	error?: string;
}

export type FieldRootAttrs = HTMLAttributes<HTMLDivElement> & {
	"data-kind": "field";
	"data-slot": "root";
	"data-invalid"?: "";
	"data-required"?: "";
	"data-disabled"?: "";
};

export type FieldLabelAttrs = HTMLLabelAttributes & {
	"data-kind": "field";
	"data-slot": "label";
	"data-required"?: "";
	"data-disabled"?: "";
};

export type FieldControlAttrs = HTMLInputAttributes & {
	"data-kind": "field";
	"data-slot": "control";
	"data-invalid"?: "";
	"data-required"?: "";
	"data-disabled"?: "";
};

export type FieldDescriptionAttrs = HTMLAttributes<HTMLDivElement> & {
	"data-kind": "field";
	"data-slot": "description";
};

export type FieldErrorAttrs = HTMLAttributes<HTMLDivElement> & {
	"data-kind": "field";
	"data-slot": "error";
	"data-invalid"?: "";
};

export interface UseFieldReturn {
	readonly root: FieldRootAttrs;
	readonly label: FieldLabelAttrs;
	readonly control: FieldControlAttrs;
	readonly description: FieldDescriptionAttrs;
	readonly error: FieldErrorAttrs;
	readonly controlId: string;
}
