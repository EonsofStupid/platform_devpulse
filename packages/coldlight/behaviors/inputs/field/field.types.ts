import type { HTMLAttributes, HTMLInputAttributes, HTMLLabelAttributes } from "svelte/elements";

export interface UseFieldProps {
	/** The label text, when one is rendered: the group and control are labelled by it. */
	label?: string;
	/** The description text, when one is rendered (it is hidden while an error shows). */
	description?: string;
	invalid?: boolean;
	required?: boolean;
	disabled?: boolean;
	/** The error text, rendered while invalid. */
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

/** The ids of a field's parts. */
export interface FieldIds {
	readonly root: string;
	readonly label: string;
	readonly control: string;
	readonly description: string;
	readonly error: string;
}

export interface UseFieldReturn {
	/** The parts' ids, for inputs that compose the field with their own anatomy. */
	readonly ids: FieldIds;
	/** The rendered description and error ids, for the control's aria-describedby. */
	readonly describedBy: string | undefined;
	/** Whether the error part is rendered (invalid with a message). */
	readonly hasError: boolean;
	readonly root: FieldRootAttrs;
	readonly label: FieldLabelAttrs;
	readonly control: FieldControlAttrs;
	readonly description: FieldDescriptionAttrs;
	readonly error: FieldErrorAttrs;
	readonly controlId: string;
}
