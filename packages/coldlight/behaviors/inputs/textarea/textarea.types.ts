import type { HTMLAttributes, HTMLLabelAttributes, HTMLTextareaAttributes } from "svelte/elements";

export interface UseTextareaProps {
	/** The label text, when one is rendered (the textarea is labelled through `for`). */
	label?: string;
	/** The description text, when one is rendered. */
	description?: string;
	/** Controlled value; `undefined` leaves it to the textarea. */
	value?: string;
	/** Starting value when uncontrolled. */
	defaultValue?: string;
	onValueChange?: (value: string) => void;
	disabled?: boolean;
	readonly?: boolean;
	required?: boolean;
	invalid?: boolean;
	/** The error text, rendered while invalid. */
	error?: string;
	/** Maximum characters; shown by the counter part. */
	maxLength?: number;
	"aria-describedby"?: string;
}

export type TextareaRootAttrs = HTMLAttributes<HTMLDivElement> & {
	"data-kind": "textarea";
	"data-slot": "root";
	"data-invalid"?: "";
	"data-required"?: "";
	"data-disabled"?: "";
};

export type TextareaInputAttrs = HTMLTextareaAttributes & {
	"data-kind": "textarea";
	"data-slot": "input";
	"data-invalid"?: "";
	"data-disabled"?: "";
	"data-readonly"?: "";
};

export type TextareaLabelAttrs = HTMLLabelAttributes & {
	"data-kind": "textarea";
	"data-slot": "label";
	"data-required"?: "";
	"data-disabled"?: "";
};

export type TextareaPartAttrs<S extends string> = HTMLAttributes<HTMLElement> & {
	"data-kind": "textarea";
	"data-slot": S;
};

export interface UseTextareaReturn {
	readonly value: string;
	readonly root: TextareaRootAttrs;
	readonly input: TextareaInputAttrs;
	readonly label: TextareaLabelAttrs;
	readonly description: TextareaPartAttrs<"description">;
	readonly error: TextareaPartAttrs<"error"> & { "data-invalid"?: "" };
	readonly counter: TextareaPartAttrs<"counter">;
	/** "12/280" when `maxLength` is set. */
	readonly count: string | undefined;
}
