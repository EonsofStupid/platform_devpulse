/**
 * Aspect ratio utility types.
 *
 * Responsive aspect ratio with DTCG token-backed max-width constraint.
 * Returns Tailwind class string — no inline styles.
 */

import type { SizeToken } from "#coldlight/types/spacing.js";

/** Standard aspect ratios. */
export type AspectRatioValue =
	| "1/1"
	| "4/3"
	| "3/2"
	| "16/9"
	| "16/10"
	| "21/9"
	| "2/3"
	| "3/4"
	| "9/16";

export interface UseAspectRatioProps {
	/** Aspect ratio. Preset or custom "n/n" string. Default: "16/9". */
	ratio?: AspectRatioValue | `${number}/${number}`;
	/** Max width constraint from the --size-{token} scale. */
	maxWidth?: SizeToken;
}

export interface UseAspectRatioReturn {
	/** Tailwind class string for the aspect ratio container. */
	readonly classes: string;
	/** The resolved ratio value string. */
	readonly ratio: string;
}
