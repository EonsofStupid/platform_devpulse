/**
 * @file useSpinner — behavior hook
 * @kind spinner
 * @layer primitives
 *
 * Returns ARIA attrs for an indeterminate loading spinner.
 * role="status" with aria-label so screen readers announce loading.
 */

export interface UseSpinnerOptions {
	active?: boolean;
	label?: string;
}

export function useSpinner(opts: UseSpinnerOptions) {
	return {
		root: {
			role: "status" as const,
			"aria-label": opts.label ?? "Loading",
			"aria-live": "polite" as const,
		},
	};
}
