/**
 * Container layout utility types.
 *
 * Max-width responsive container with DTCG token-backed sizing
 * from the --size-container-{size} scale.
 * Returns Tailwind class strings — no inline styles.
 */

import type { SpaceToken } from "$lib/design/types/spacing.js";

/** Container size presets mapped to --size-container-{size} tokens. */
export type ContainerSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "full";

export interface ContainerProps {
	/** Max-width preset or "full" for 100%. Default: "lg". */
	size?: ContainerSize;
	/** Inline padding via --space-{token}. */
	padding?: SpaceToken;
	/** Center the container with mx-auto. Default: true. */
	centered?: boolean;
}
