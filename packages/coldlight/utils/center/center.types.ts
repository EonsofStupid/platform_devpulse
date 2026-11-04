/**
 * Center layout utility types.
 *
 * Centering container with DTCG token-backed max-width, padding, and gutters.
 * Returns Tailwind class strings — no inline styles.
 */

import type { SizeToken, SpaceToken } from "#coldlight/types/spacing.js";

export interface CenterProps {
	/** Max width constraint via --size-{token}. */
	maxWidth?: SizeToken;
	/** Inner padding via --space-{token}. */
	padding?: SpaceToken;
	/** Horizontal gutters (left/right padding) via --space-{token}. */
	gutters?: SpaceToken;
	/** Also centre what it holds on both axes: a flex box, or an inline one (the old Center kind). */
	content?: "block" | "inline";
}
