/**
 * @file useAlert — behavior hook
 * @kind alert
 * @layer primitives
 *
 * Returns ARIA attrs for alert slots.
 * No styling. No DOM. Pure behavior.
 */

export interface UseAlertOptions {
	variant?: string;
	dismissible?: boolean;
}

export function useAlert(opts: UseAlertOptions) {
	return {
		root: {
			role: "alert" as const,
			"aria-live": "assertive" as const,
		},
		dismiss: {
			"aria-label": "Dismiss alert",
		},
	};
}
