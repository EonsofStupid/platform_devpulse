/**
 * @file builders/breadcrumb/types.ts
 * @package @devpulse/coldlight
 *
 * Props for the Breadcrumb builder.
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/
 */

import type { MaybeGetter } from "../_internal/types.js";

/** Constructor config for Breadcrumb. */
export type BreadcrumbProps = {
	/** Accessible label for the breadcrumb navigation. @default "Breadcrumb" */
	label?: MaybeGetter<string | undefined>;
	/** Separator character or string between items. @default "/" */
	separator?: MaybeGetter<string | undefined>;
};
