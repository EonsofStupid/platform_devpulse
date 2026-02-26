/**
 * @file builders/description-list/types.ts
 * @package @devpulse/coldlight
 *
 * Props for the DescriptionList builder.
 * Semantic <dl>/<dt>/<dd> — native description list semantics.
 */

import type { MaybeGetter } from "../_internal/types.js";

/** Constructor config for DescriptionList. MaybeGetter for controlled/uncontrolled. */
export type DescriptionListProps = {
	/** Accessible label for the description list. */
	label?: MaybeGetter<string | undefined>;
};
