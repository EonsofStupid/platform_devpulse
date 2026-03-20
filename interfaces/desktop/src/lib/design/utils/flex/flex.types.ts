/**
 * Flex layout utility types.
 *
 * DTCG-typed props. All spacing via SD5 --space-* custom properties.
 */

import type { SpaceToken } from "$lib/design/types/spacing.js";

/** Flex direction values. */
export type FlexDirection = "row" | "column" | "row-reverse" | "column-reverse";

/** Flex align-items values. */
export type FlexAlign = "start" | "center" | "end" | "stretch" | "baseline";

/** Flex justify-content values. */
export type FlexJustify = "start" | "center" | "end" | "between" | "around" | "evenly";

/** Flex wrap mode. */
export type FlexWrap = boolean | "reverse";

export interface FlexProps {
	/** Flex direction. Default: "row". */
	direction?: FlexDirection;
	/** Gap — SpaceToken key resolving to --space-{token}. */
	gap?: SpaceToken;
	/** Align items. */
	align?: FlexAlign;
	/** Justify content. */
	justify?: FlexJustify;
	/** Wrap behavior. true = wrap, "reverse" = wrap-reverse, false/undefined = nowrap. */
	wrap?: FlexWrap;
	/** Padding — SpaceToken key resolving to --space-{token}. */
	padding?: SpaceToken;
}
