/**
 * useField — ColdLight compound form field primitive hook.
 *
 * Links label → control → description → error via ARIA.
 * Parts: root (group), label, control, description, error.
 *
 * The control slot provides aria-describedby that composes the rendered description and error IDs;
 * pass `label` and `description` (their text) so no reference points at a part that is not rendered.
 * The error slot uses role=alert + aria-live=polite for screen reader announcements.
 */

import { dataAttr, disabledAttr } from "../../_internal/utils/data-attr.js";
import { createIds } from "../../_internal/utils/uid.js";
import { fieldAnatomy } from "./field.anatomy.js";
import type { UseFieldProps, UseFieldReturn } from "./field.types.js";

export function useField(props: UseFieldProps = {}): UseFieldReturn {
	const ids = createIds("field", ["root", "label", "control", "description", "error"] as const);

	const invalid = $derived(props.invalid ?? false);
	const required = $derived(props.required ?? false);
	const disabled = $derived(props.disabled ?? false);
	// References point only at parts that are rendered: a label when there is label text, the
	// description while no error replaces it, the error while invalid with a message.
	const hasLabel = $derived(!!props.label);
	const hasError = $derived(invalid && !!props.error);
	const hasDescription = $derived(!!props.description && !invalid);

	const describedBy = $derived(
		[hasDescription ? ids.description : null, hasError ? ids.error : null]
			.filter(Boolean)
			.join(" ") || undefined,
	);

	const root = $derived({
		...fieldAnatomy.attrs.root,
		id: ids.root,
		role: "group" as const,
		"aria-labelledby": hasLabel ? ids.label : undefined,
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
		ids,
		get describedBy() {
			return describedBy;
		},
		get hasError() {
			return hasError;
		},
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
