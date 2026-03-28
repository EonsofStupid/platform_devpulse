/**
 * Box layout utility types.
 *
 * DTCG-typed props. Padding via SD5 --space-*, max-width via --size-*.
 */

import type { SizeToken, SpaceToken } from "$lib/design/types/spacing.js";

export interface BoxProps {
	/** Uniform padding. SpaceToken key resolving to --space-{token}. */
	padding?: SpaceToken;
	/** Horizontal padding. SpaceToken key resolving to --space-{token}. */
	paddingX?: SpaceToken;
	/** Vertical padding. SpaceToken key resolving to --space-{token}. */
	paddingY?: SpaceToken;
	/** Max width constraint. SizeToken key resolving to --size-{token}. */
	maxWidth?: SizeToken;
}
