/**
 * Horizontal stack layout types.
 *
 * All spacing typed via SD5-generated DTCG token types.
 * Returns Tailwind class string.
 */

import type { SpaceToken } from "#coldlight/types/spacing.js";

export interface HStackProps {
	/** Gap between children. DTCG SpaceToken. */
	gap?: SpaceToken;
	/** Cross-axis alignment. */
	align?: "start" | "center" | "end" | "stretch" | "baseline";
	/** Main-axis justification. */
	justify?: "start" | "center" | "end" | "between" | "around" | "evenly";
	/** Allow children to wrap. */
	wrap?: boolean;
	/** Reverse direction. */
	reverse?: boolean;
}
