/**
 * useTextField — ColdLight text input primitive hook.
 *
 * Native <input> with validation state, label/description/error linkage.
 * Parts: root, input, label, description, error.
 */

import { createIds } from "../../_internal/utils/uid.js";
import { dataAttr, disabledAttr } from "../../_internal/utils/data-attr.js";
import { textFieldAnatomy } from "./text-field.anatomy.js";
import type { UseTextFieldProps, UseTextFieldReturn } from "./text-field.types.js";

export function useTextField(props: UseTextFieldProps = {}): UseTextFieldReturn {
	const ids = createIds("text-field", ["root", "input", "label", "description", "error"] as const);

	let value = $state(props.value ?? "");
	const disabled = $derived(props.disabled ?? false);
	const readOnly = $derived(props.readonly ?? false);
	const required = $derived(props.required ?? false);
	const invalid = $derived(props.invalid ?? false);
	const hasError = $derived(invalid && !!props.error);

	const describedBy = $derived(
		[
			props["aria-describedby"],
			ids.description,
			hasError ? ids.error : null,
		].filter(Boolean).join(" ") || undefined,
	);

	const root = $derived({
		...textFieldAnatomy.attrs.root,
		id: ids.root,
		"data-disabled": dataAttr(disabled),
		"data-invalid": dataAttr(invalid),
	});

	const input = $derived({
		...textFieldAnatomy.attrs.input,
		id: ids.input,
		type: props.type ?? "text",
		value,
		placeholder: props.placeholder,
		disabled: disabled || undefined,
		readonly: readOnly || undefined,
		required: required || undefined,
		"aria-invalid": invalid ? (true as const) : undefined,
		"aria-required": required ? (true as const) : undefined,
		"aria-disabled": disabledAttr(disabled),
		"aria-readonly": readOnly ? (true as const) : undefined,
		"aria-label": props["aria-label"],
		"aria-labelledby": props["aria-labelledby"] ?? ids.label,
		"aria-describedby": describedBy,
		"aria-errormessage": hasError ? ids.error : undefined,
		"data-disabled": dataAttr(disabled),
		"data-readonly": dataAttr(readOnly),
		"data-invalid": dataAttr(invalid),
		oninput: (e: Event) => {
			const target = e.target as HTMLInputElement;
			value = target.value;
			props.onValueChange?.(value);
		},
	});

	const label = $derived({
		...textFieldAnatomy.attrs.label,
		id: ids.label,
		for: ids.input,
		"data-disabled": dataAttr(disabled),
	});

	const description = $derived({
		...textFieldAnatomy.attrs.description,
		id: ids.description,
	});

	const error = $derived({
		...textFieldAnatomy.attrs.error,
		id: ids.error,
		role: "alert" as const,
		"aria-live": "polite" as const,
		"data-invalid": dataAttr(invalid),
	});

	return {
		get value() { return value; },
		get root() { return root; },
		get input() { return input; },
		get label() { return label; },
		get description() { return description; },
		get error() { return error; },
		focus() { document.getElementById(ids.input)?.focus(); },
		clear() { value = ""; props.onValueChange?.(""); },
	};
}
