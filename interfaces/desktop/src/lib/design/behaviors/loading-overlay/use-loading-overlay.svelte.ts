/**
 * @file useLoadingOverlay — behavior hook
 * @kind loading-overlay
 * @layer primitives
 *
 * Returns ARIA attrs for a loading overlay.
 * role="alert" + aria-busy while visible. Blocks interaction.
 */

export interface UseLoadingOverlayOptions {
	visible?: boolean;
	label?: string;
}

export function useLoadingOverlay(opts: UseLoadingOverlayOptions) {
	return {
		root: {
			role: "alert" as const,
			"aria-busy": (opts.visible ?? false) ? ("true" as const) : ("false" as const),
			"aria-label": opts.label ?? "Loading",
		},
	};
}
