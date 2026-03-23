/**
 * @file useTextarea — behavior hook
 * @kind textarea
 * @layer primitives
 *
 * Returns ARIA attrs for a multi-line text input.
 * Handles disabled, readonly, required, invalid states.
 */

export interface UseTextareaOptions {
	disabled?: boolean;
	readonly?: boolean;
	required?: boolean;
	invalid?: boolean;
}

export function useTextarea(opts: UseTextareaOptions) {
	return {
		root: {
			"aria-invalid": (opts.invalid ?? false) ? ("true" as const) : undefined,
			"aria-required": (opts.required ?? false) ? ("true" as const) : undefined,
			"aria-disabled": (opts.disabled ?? false) ? ("true" as const) : undefined,
			"aria-readonly": (opts.readonly ?? false) ? ("true" as const) : undefined,
		},
	};
}
