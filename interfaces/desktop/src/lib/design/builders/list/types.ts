/**
 * @file builders/list/types.ts
 * @package @devpulse/coldlight
 *
 * Props for the List builder.
 * Semantic list — native <ul>/<li> semantics, role="list".
 */

import type { MaybeGetter } from "../_internal/types.js";

/** Constructor config for List. MaybeGetter for controlled/uncontrolled. */
export type ListProps = {
	/** Accessible label for the list. */
	label?: MaybeGetter<string | undefined>;
};
