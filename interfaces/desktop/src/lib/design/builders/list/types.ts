/**
 * @file builders/list/types.ts
 * @package @devpulse/coldlight
 *
 * Props for the List builder.
 * Semantic list — native `<ul>`/`<li>` semantics, `role="list"`.
 */

import type { MaybeGetter } from "../_internal/types.js";

/**
 * Constructor config for the List builder.
 *
 * All props support `MaybeGetter<T>` for controlled/uncontrolled patterns.
 */
export type ListProps = {
	/**
	 * Accessible label for the list.
	 * Sets `aria-label` on the root element.
	 * @default undefined
	 */
	label?: MaybeGetter<string | undefined>;
};
