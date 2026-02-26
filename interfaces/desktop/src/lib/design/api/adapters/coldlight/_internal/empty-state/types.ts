/**
 * @file builders/empty-state/types.ts
 * @package @devpulse/coldlight
 *
 * Props for the ColdLight EmptyState builder.
 *
 * Placeholder for empty content areas.
 * Contract: `role="status"` -- polite live region.
 */

import type { MaybeGetter } from "../../../../../builders/_internal/types.js";

/** Constructor config for the {@link EmptyState} builder. */
export type EmptyStateProps = {
	/**
	 * Accessible label for the empty state region.
	 *
	 * When provided, applied as `aria-label` on the root element.
	 * When absent, the root element has no explicit label (content
	 * provides implicit labelling via title/description).
	 *
	 * @default ""
	 */
	label?: MaybeGetter<string | undefined>;
};
