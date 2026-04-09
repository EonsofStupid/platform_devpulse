/**
 * useField — ColdLight compound form field primitive hook.
 *
 * Links label → control → description → error via ARIA.
 * Parts: root (group), label, control, description, error.
 *
 * The control slot provides aria-describedby that composes description + error IDs.
 * The error slot uses role=alert + aria-live=polite for screen reader announcements.
 */

import { dataAttr, disabledAttr } from "../_internal/utils/data-attr.js";
import { createIds } from "../_internal/utils/uid.js";
import { fieldAnatomy } from "./field.anatomy.js";
import type { UseFieldProps, UseFieldReturn } from "./field.types.js";

export function useField(props: UseFieldProps = {}): UseFieldReturn {
	const ids = createIds("field", ["root", "label", "control", "description", "error"] as const);

	const invalid = $derived(props.invalid ?? false);
	const required = $derived(props.required ?? false);
	const disabled = $derived(props.disabled ?? false);
	const hasError = $derived(invalid && !!props.error);

	const describedBy = $derived(
		[ids.description, hasError ? ids.error : null].filter(Boolean).join(" ") || undefined,
	);

	const root = $derived({
		...fieldAnatomy.attrs.root,
		id: ids.root,
		role: "group" as const,
		"aria-labelledby": ids.label,
		"data-invalid": dataAttr(invalid),
		"data-required": dataAttr(required),
		"data-disabled": dataAttr(disabled),
	});

	const label = $derived({
		...fieldAnatomy.attrs.label,
		id: ids.label,
		for: ids.control,
		"data-required": dataAttr(required),
		"data-disabled": dataAttr(disabled),
	});

	const control = $derived({
		...fieldAnatomy.attrs.control,
		id: ids.control,
		"aria-describedby": describedBy,
		"aria-invalid": invalid ? ("true" as const) : undefined,
		"aria-required": required ? ("true" as const) : undefined,
		"aria-disabled": disabledAttr(disabled),
		"data-invalid": dataAttr(invalid),
		"data-required": dataAttr(required),
		"data-disabled": dataAttr(disabled),
	});

	const description = $derived({
		...fieldAnatomy.attrs.description,
		id: ids.description,
	});

	const error = $derived({
		...fieldAnatomy.attrs.error,
		id: ids.error,
		role: "alert" as const,
		"aria-live": "polite" as const,
		"data-invalid": dataAttr(invalid),
	});

	return {
		get root() {
			return root;
		},
		get label() {
			return label;
		},
		get control() {
			return control;
		},
		get description() {
			return description;
		},
		get error() {
			return error;
		},
		get controlId() {
			return ids.control;
		},
	};
}
