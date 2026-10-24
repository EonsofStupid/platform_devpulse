/**
 * Spacer layout utility types.
 *
 * Flexible spacer element with DTCG token-backed sizing.
 * Returns Tailwind class strings — no inline styles.
 */

import type { SpaceToken } from "#coldlight/types/spacing.js";

export interface UseSpacerProps {
	/** Spacer size from the --space-{n} token scale. */
	size?: SpaceToken;
	/** Axis along which the spacer applies. Default: "y". */
	axis?: "x" | "y" | "both";
	/** Whether the spacer should grow to fill available space. Default: false. */
	grow?: boolean;
}

export interface UseSpacerReturn {
	/** Tailwind class string for the spacer element. */
	readonly classes: string;
}
