import { createIds } from "../_internal/utils/uid.js";
export interface UseFormFieldOptions { invalid?: boolean; required?: boolean; disabled?: boolean; }
export function useFormField(opts: UseFormFieldOptions) {
	const ids = createIds("form-field", ["root", "label", "control", "description", "error"] as const);
	return {
		ids,
		root: { "data-kind": "form-field" as const, "data-slot": "root" as const, "data-invalid": opts.invalid ? ("" as const) : undefined },
		label: { id: ids.label, for: ids.control },
		control: { id: ids.control, "aria-describedby": ids.description, "aria-invalid": opts.invalid ? ("true" as const) : undefined, "aria-required": opts.required ? ("true" as const) : undefined, "aria-disabled": opts.disabled ? ("true" as const) : undefined },
		description: { id: ids.description },
		error: { id: ids.error, role: "alert" as const },
	};
}
