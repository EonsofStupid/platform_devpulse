/**
 * @file builders/card/types.ts
 * @package @devpulse/coldlight
 *
 * Props for the ColdLight Card builder.
 *
 * Semantic grouping -- `role="group"` or `<article>`.
 * `aria-label` or `aria-labelledby` for card title association.
 */

import type { MaybeGetter } from "../../../../../builders/_internal/types.js";

/** Constructor config for the {@link Card} builder. */
export type CardProps = {
	/**
	 * Accessible label for the card.
	 *
	 * Applied as `aria-label` on the root element.
	 * Mutually exclusive with `labelledBy` in practice.
	 *
	 * @default undefined
	 */
	label?: MaybeGetter<string | undefined>;

	/**
	 * ID of the element that labels the card (e.g. the card header/title).
	 *
	 * Applied as `aria-labelledby` on the root element.
	 * Mutually exclusive with `label` in practice.
	 *
	 * @default undefined
	 */
	labelledBy?: MaybeGetter<string | undefined>;
};
