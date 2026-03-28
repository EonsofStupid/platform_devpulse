/**
 * @file useBanner — behavior hook
 * @kind banner
 * @layer primitives
 *
 * Returns ARIA attrs for banner slots.
 * Banner is a landmark region, not an alert.
 */

export interface UseBannerOptions {
	disabled?: boolean;
}

export function useBanner(_opts: UseBannerOptions) {
	return {
		root: {
			role: "region" as const,
			"aria-label": "Site banner",
		},
		dismiss: {
			"aria-label": "Close banner",
		},
	};
}
