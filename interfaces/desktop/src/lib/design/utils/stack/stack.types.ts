/**
 * Vertical stack utility types.
 *
 * DTCG-typed props. All spacing via SD5 --space-* custom properties.
 */

import type { SpaceToken } from "$lib/design/types/spacing.js";

export interface StackProps {
	/** Gap between children — SpaceToken key resolving to --space-{token}. */
	gap?: SpaceToken;
	/** Cross-axis alignment. */
	align?: "start" | "center" | "end" | "stretch" | "baseline";
	/** Main-axis justification. */
	justify?: "start" | "center" | "end" | "between" | "around" | "evenly";
	/** Reverse direction (column-reverse). Default: false. */
	reverse?: boolean;
}
