/**
 * useTextField — ColdLight text input primitive hook.
 *
 * A native <input> composed on the field core (useField): the field owns the
 * label / description / error linkage, this adds the input, its value and its
 * states. Parts: root, input, label, description, error.
 */

import { controllable } from "../../_internal/utils/controllable.svelte.js";
import { dataAttr, disabledAttr } from "../../_internal/utils/data-attr.js";
import { useField } from "../field/use-field.svelte.js";
import { textFieldAnatomy } from "./text-field.anatomy.js";
import type { UseTextFieldProps, UseTextFieldReturn } from "./text-field.types.js";

export function useTextField(props: UseTextFieldProps = {}): UseTextFieldReturn {
	// The linkage is the field's; references point only at rendered parts.
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

	const describedBy = $derived(
		[props["aria-describedby"], field.describedBy].filter(Boolean).join(" ") || undefined,
	);

	const root = $derived({
		...textFieldAnatomy.attrs.root,
		id: field.ids.root,
		"data-disabled": dataAttr(disabled),
		"data-invalid": dataAttr(invalid),
		"data-required": dataAttr(required),
	});

	const input = $derived({
		...textFieldAnatomy.attrs.input,
		id: field.ids.control,
		type: props.type ?? "text",
		value: value.current,
		placeholder: props.placeholder,
		disabled: disabled || undefined,
		readonly: readOnly || undefined,
		required: required || undefined,
		"aria-invalid": invalid ? (true as const) : undefined,
		"aria-required": required ? (true as const) : undefined,
		"aria-disabled": disabledAttr(disabled),
		"aria-readonly": readOnly ? (true as const) : undefined,
		"aria-label": props["aria-label"],
		// A rendered label names the input through `for`; only a caller's own reference goes here.
		"aria-labelledby": props["aria-labelledby"],
		"aria-describedby": describedBy,
		"aria-errormessage":
			props["aria-errormessage"] ?? (field.hasError ? field.ids.error : undefined),
		"data-disabled": dataAttr(disabled),
		"data-readonly": dataAttr(readOnly),
		"data-invalid": dataAttr(invalid),
		oninput: (e: Event) => {
			value.set((e.target as HTMLInputElement).value);
		},
	});

	const label = $derived({
		...textFieldAnatomy.attrs.label,
		id: field.ids.label,
		for: field.ids.control,
		"data-required": dataAttr(required),
		"data-disabled": dataAttr(disabled),
	});

	const description = $derived({
		...textFieldAnatomy.attrs.description,
		id: field.ids.description,
	});

	const error = $derived({
		...textFieldAnatomy.attrs.error,
		id: field.ids.error,
		role: "alert" as const,
		"aria-live": "polite" as const,
		"data-invalid": dataAttr(invalid),
	});

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
		focus() {
			document.getElementById(field.ids.control)?.focus();
		},
		clear() {
			value.set("");
		},
	};
}
