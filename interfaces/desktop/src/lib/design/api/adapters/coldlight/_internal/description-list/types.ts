/**
 * @file builders/description-list/types.ts
 * @package @devpulse/coldlight
 *
 * Props for the DescriptionList builder.
 * Semantic `<dl>`/`<dt>`/`<dd>` — native description list semantics.
 */

import type { MaybeGetter } from "../../../../../builders/_internal/types.js";

/**
 * Constructor config for DescriptionList.
 *
 * All props support the `MaybeGetter<T>` pattern for controlled/uncontrolled usage.
 */
export type DescriptionListProps = {
	/**
	 * Accessible label for the description list.
	 *
	 * Applied as `aria-label` on the root `<dl>` element.
	 * Getter = controlled, static = uncontrolled.
	 *
	 * @default undefined
	 */
	label?: MaybeGetter<string | undefined>;
};
