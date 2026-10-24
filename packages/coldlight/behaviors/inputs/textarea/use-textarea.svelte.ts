/**
 * @file useTextarea — behavior hook
 * @kind textarea
 * @layer behaviors
 *
 * A multi-line text input composed on the field core (useField), like
 * useTextField: the field owns the label / description / error linkage, this
 * adds the textarea, its value, its states and the character counter.
 * Parts: root, input, label, description, error, counter.
 */

import { controllable } from "../../_internal/utils/controllable.svelte.js";
import { dataAttr, disabledAttr } from "../../_internal/utils/data-attr.js";
import { useField } from "../field/use-field.svelte.js";
import { textareaAnatomy } from "./textarea.anatomy.js";
import type { UseTextareaProps, UseTextareaReturn } from "./textarea.types.js";

export function useTextarea(props: UseTextareaProps = {}): UseTextareaReturn {
	const field = useField({
		get label() {
			return props.label;
		},
		get description() {
			return props.description;
		},
		get invalid() {
			return props.invalid;
		},
		get required() {
			return props.required;
		},
		get disabled() {
			return props.disabled;
		},
		get error() {
			return props.error;
		},
	});

	// Controlled when the owner passes `value` (plan 0006 T2).
	const value = controllable({
		value: () => props.value,
		defaultValue: () => props.defaultValue ?? "",
		onChange: (next) => props.onValueChange?.(next),
	});

	const disabled = $derived(props.disabled ?? false);
	const readOnly = $derived(props.readonly ?? false);
	const required = $derived(props.required ?? false);
	const invalid = $derived(props.invalid ?? false);
	const count = $derived(
		props.maxLength === undefined ? undefined : `${value.current.length}/${props.maxLength}`,
	);

	const describedBy = $derived(
		[props["aria-describedby"], field.describedBy].filter(Boolean).join(" ") || undefined,
	);

	const root = $derived({
		...textareaAnatomy.attrs.root,
		id: field.ids.root,
		"data-invalid": dataAttr(invalid),
		"data-required": dataAttr(required),
		"data-disabled": dataAttr(disabled),
	});

	const input = $derived({
		...textareaAnatomy.attrs.input,
		id: field.ids.control,
		value: value.current,
		maxlength: props.maxLength,
		disabled: disabled || undefined,
		readonly: readOnly || undefined,
		required: required || undefined,
		"aria-invalid": invalid ? (true as const) : undefined,
		"aria-required": required ? (true as const) : undefined,
		"aria-disabled": disabledAttr(disabled),
		"aria-readonly": readOnly ? (true as const) : undefined,
		"aria-describedby": describedBy,
		"aria-errormessage": field.hasError ? field.ids.error : undefined,
		"data-invalid": dataAttr(invalid),
		"data-disabled": dataAttr(disabled),
		"data-readonly": dataAttr(readOnly),
		oninput: (e: Event) => {
			value.set((e.target as HTMLTextAreaElement).value);
		},
	});

	const label = $derived({
		...textareaAnatomy.attrs.label,
		id: field.ids.label,
		for: field.ids.control,
		"data-required": dataAttr(required),
		"data-disabled": dataAttr(disabled),
	});

	const description = $derived({ ...textareaAnatomy.attrs.description, id: field.ids.description });

	const error = $derived({
		...textareaAnatomy.attrs.error,
		id: field.ids.error,
		role: "alert" as const,
		"aria-live": "polite" as const,
		"data-invalid": dataAttr(invalid),
	});

	const counter = $derived({ ...textareaAnatomy.attrs.counter });

	return {
		get value() {
			return value.current;
		},
		get root() {
			return root;
		},
		get input() {
			return input;
		},
		get label() {
			return label;
		},
		get description() {
			return description;
		},
		get error() {
			return error;
		},
		get counter() {
			return counter;
		},
		get count() {
			return count;
		},
	};
}
