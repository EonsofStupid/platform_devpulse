/**
 * @file builders/text/types.ts
 * @package @devpulse/coldlight
 *
 * Props for the ColdLight Text builder.
 * Mirrors primitives/text/contract.ts -- `role: "none"`, zero ARIA.
 */

import type { MaybeGetter } from "../../builders/types.js";

/** Polymorphic element tag for Text. */
export type TextAs = "span" | "p" | "div" | "label" | "strong" | "em" | "small";

/** Constructor config for Text builder. */
export type TextProps = {
	/**
	 * Polymorphic element tag.
	 * Determines which HTML element is rendered at the component level.
	 *
	 * @default "span"
	 */
	as?: MaybeGetter<TextAs | undefined>;
};
