/**
 * @file builders/card/types.ts
 * @package @devpulse/coldlight
 *
 * Props for the Card builder.
 * Semantic grouping — role="group" or <article>.
 * aria-labelledby for card title association.
 */

import type { MaybeGetter } from "../_internal/types.js";

/** Constructor config for Card. MaybeGetter for controlled/uncontrolled. */
export type CardProps = {
	/** Accessible label for the card. */
	label?: MaybeGetter<string | undefined>;
	/** ID of element that labels the card (e.g. the card header/title). */
	labelledBy?: MaybeGetter<string | undefined>;
};
