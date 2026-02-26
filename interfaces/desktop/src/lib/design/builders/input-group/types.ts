/**
 * @file builders/input-group/types.ts
 * @package @devpulse/coldlight
 *
 * Props for the InputGroup builder.
 * Container grouping for input with prefix/suffix addons.
 */

import type { MaybeGetter } from "../_internal/types.js";

export type InputGroupProps = {
	/** Disable the entire input group. @default false */
	disabled?: MaybeGetter<boolean | undefined>;
	/** Accessible label for the group. */
	"aria-label"?: string;
	/** ID of the labelling element. */
	"aria-labelledby"?: string;
};
