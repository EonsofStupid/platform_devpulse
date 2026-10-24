/**
 * @file useSkeleton — behavior hook
 * @kind skeleton
 * @layer primitives
 *
 * Returns ARIA attrs for a loading placeholder.
 * aria-busy while loading. aria-hidden when decorative.
 */

export interface UseSkeletonOptions {
	loading?: boolean;
}

export function useSkeleton(opts: UseSkeletonOptions) {
	return {
		root: {
			"aria-busy": (opts.loading ?? true) ? ("true" as const) : undefined,
			"aria-hidden": "true" as const,
		},
	};
}
