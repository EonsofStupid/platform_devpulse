/**
 * @file builders/empty-state/types.ts
 * @package @devpulse/coldlight
 *
 * Props for the EmptyState builder.
 * Placeholder for empty content areas.
 */

import type { MaybeGetter } from "../_internal/types.js";

/** Constructor config for EmptyState. */
export type EmptyStateProps = {
	/** Accessible label for the empty state region. */
	label?: MaybeGetter<string | undefined>;
};
