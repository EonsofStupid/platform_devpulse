/**
 * @file builders/breadcrumb/types.ts
 * @package @devpulse/coldlight
 *
 * Props for the Breadcrumb builder.
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/
 */

import type { MaybeGetter } from "../../builders/types.js";

/**
 * Constructor config for the Breadcrumb builder.
 *
 * All props support `MaybeGetter<T>` for controlled/uncontrolled patterns.
 */
export type BreadcrumbProps = {
	/**
	 * Accessible label for the breadcrumb navigation.
	 * Sets `aria-label` on the root `<nav>` element.
	 * @default "Breadcrumb"
	 */
	label?: MaybeGetter<string | undefined>;

	/**
	 * Separator character or string between items.
	 * Displayed between breadcrumb links (hidden from assistive tech via `aria-hidden`).
	 * @default "/"
	 */
	separator?: MaybeGetter<string | undefined>;
};
