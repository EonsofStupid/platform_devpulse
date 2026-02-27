/**
 * @file builders/heading/types.ts
 * @package @devpulse/coldlight
 *
 * Props for the ColdLight Heading builder.
 * Mirrors primitives/heading/contract.ts -- `role: "heading"`, `aria-level`.
 */

import type { MaybeGetter } from "../../builders/types.js";

/** Heading level (1-6), maps to `h1`-`h6` HTML tags and `aria-level`. */
export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

/** Constructor config for Heading builder. */
export type HeadingProps = {
	/**
	 * Semantic heading level (1-6).
	 * Determines the `aria-level` attribute on the root element.
	 * Can be decoupled from the visual heading element (`h1`-`h6`).
	 *
	 * @default 2
	 */
	level?: MaybeGetter<HeadingLevel | undefined>;
};
