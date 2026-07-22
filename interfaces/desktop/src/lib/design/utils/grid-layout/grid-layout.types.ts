/**
 * Grid layout utility types.
 *
 * CSS Grid container with DTCG token-backed gap, padding, and sizing.
 * Returns Tailwind class strings — no inline styles.
 */

import type { SpaceToken } from "$lib/design/generated/types/spacing.js";

export interface GridLayoutProps {
	/** Number of columns (-> grid-cols-{n}) or explicit template string (-> grid-cols-[{value}]). */
	columns?: number | string;
	/** Number of rows (-> grid-rows-{n}) or explicit template string (-> grid-rows-[{value}]). */
	rows?: number | string;
	/** Grid gap via --space-{token}. */
	gap?: SpaceToken;
	/** Column gap override via --space-{token}. */
	columnGap?: SpaceToken;
	/** Row gap override via --space-{token}. */
	rowGap?: SpaceToken;
	/** Padding via --space-{token}. */
	padding?: SpaceToken;
	/** Grid auto-flow direction. */
	autoFlow?: "row" | "column" | "dense" | "row dense" | "column dense";
	/** Align items on the block axis. */
	alignItems?: "start" | "center" | "end" | "stretch";
	/** Justify items on the inline axis. */
	justifyItems?: "start" | "center" | "end" | "stretch";
}
