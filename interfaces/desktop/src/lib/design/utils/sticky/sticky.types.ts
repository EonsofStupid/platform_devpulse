/**
 * Sticky positioning utility types.
 *
 * DTCG-typed: SpaceToken for offset, ZIndexToken for z-index.
 * Returns Tailwind class string via cn().
 */

import type { SpaceToken, ZIndexToken } from "$lib/design/types/spacing.js";

export interface UseStickyProps {
	/** Offset from top when stuck. DTCG SpaceToken. Default: "0". */
	offset?: SpaceToken;
	/** Z-index when stuck. DTCG ZIndexToken. Default: "sticky". */
	zIndex?: ZIndexToken;
}

export interface UseStickyReturn {
	/** Tailwind class string for sticky positioning. */
	readonly className: string;
}
